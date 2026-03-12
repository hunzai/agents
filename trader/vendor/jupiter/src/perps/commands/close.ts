import { BN } from "@coral-xyz/anchor";
import { PublicKey, ComputeBudgetProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { createCloseAccountInstruction, getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { JUPITER_PERPETUALS_PROGRAM, JLP_POOL_ACCOUNT_PUBKEY, JUPITER_PERPETUALS_PROGRAM_ID, RPC_CONNECTION } from "../constants.js";
import { loadWallet } from "openclaw-common";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

function generatePositionRequestPda(positionPubkey: PublicKey, requestChange: "increase" | "decrease") {
  const counter = new BN(Math.floor(Math.random() * 1_000_000_000));
  const requestChangeEnum = requestChange === "increase" ? [1] : [2];
  const positionRequest = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_request"),
      positionPubkey.toBuffer(),
      counter.toArrayLike(Buffer, "le", 8),
      Buffer.from(requestChangeEnum),
    ],
    JUPITER_PERPETUALS_PROGRAM_ID
  )[0];
  return { positionRequest, counter };
}

export async function closePosition(positionPubkey: string, walletPath: string) {
  try {
    const wallet = loadWallet(walletPath);
    const position = await JUPITER_PERPETUALS_PROGRAM.account.position.fetch(new PublicKey(positionPubkey));

    const { positionRequest, counter } = generatePositionRequestPda(new PublicKey(positionPubkey), "decrease");

    const isLong = !!position.side.long;
    const desiredMint = isLong ? NATIVE_MINT : USDC_MINT;
    const receivingAccount = getAssociatedTokenAddressSync(desiredMint, position.owner, true);
    const positionRequestAta = getAssociatedTokenAddressSync(desiredMint, positionRequest, true);

    const postInstructions = [];
    if (desiredMint.equals(NATIVE_MINT)) {
      postInstructions.push(createCloseAccountInstruction(receivingAccount, position.owner, position.owner));
    }

    const decreaseIx = await JUPITER_PERPETUALS_PROGRAM.methods
      .createDecreasePositionMarketRequest({
        collateralUsdDelta: new BN(0),
        sizeUsdDelta: new BN(0),
        priceSlippage: new BN(isLong ? 50_000_000 : 200_000_000),
        jupiterMinimumOut: null,
        counter,
        entirePosition: true,
      })
      .accounts({
        owner: position.owner,
        receivingAccount,
        perpetuals: PublicKey.findProgramAddressSync([Buffer.from("perpetuals")], JUPITER_PERPETUALS_PROGRAM_ID)[0],
        pool: JLP_POOL_ACCOUNT_PUBKEY,
        position: new PublicKey(positionPubkey),
        positionRequest,
        positionRequestAta,
        custody: position.custody,
        collateralCustody: position.collateralCustody,
        desiredMint,
        referral: null,
      })
      .instruction();

    const { blockhash } = await RPC_CONNECTION.getLatestBlockhash("confirmed");
    const instructions = [
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      decreaseIx,
      ...postInstructions,
    ];

    const tx = new VersionedTransaction(
      new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: blockhash, instructions }).compileToV0Message()
    );

    tx.sign([wallet]);
    const signature = await RPC_CONNECTION.sendTransaction(tx, { skipPreflight: true });

    return { success: true, tx: signature, txUrl: `https://solscan.io/tx/${signature}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
