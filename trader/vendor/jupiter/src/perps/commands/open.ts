import { BN } from "@coral-xyz/anchor";
import { PublicKey, ComputeBudgetProgram, SystemProgram, TransactionMessage, VersionedTransaction, TransactionInstruction } from "@solana/web3.js";
import { createAssociatedTokenAccountIdempotentInstruction, createSyncNativeInstruction, createCloseAccountInstruction, getAssociatedTokenAddressSync, NATIVE_MINT } from "@solana/spl-token";
import { JUPITER_PERPETUALS_PROGRAM, JLP_POOL_ACCOUNT_PUBKEY, JUPITER_PERPETUALS_PROGRAM_ID, CUSTODY_PUBKEY, RPC_CONNECTION } from "../constants.js";
import { loadWallet } from "openclaw-common";

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const SOL_DECIMALS = 9;
const USDC_DECIMALS = 6;

function generatePositionPda(owner: PublicKey, custody: PublicKey, collateralCustody: PublicKey, side: "long" | "short"): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("position"),
      owner.toBuffer(),
      JLP_POOL_ACCOUNT_PUBKEY.toBuffer(),
      custody.toBuffer(),
      collateralCustody.toBuffer(),
      side === "long" ? Buffer.from([1]) : Buffer.from([2]),
    ],
    JUPITER_PERPETUALS_PROGRAM_ID
  )[0];
}

function generatePositionRequestPda(positionPubkey: PublicKey) {
  const counter = new BN(Math.floor(Math.random() * 1_000_000_000));
  const positionRequest = PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_request"),
      positionPubkey.toBuffer(),
      counter.toArrayLike(Buffer, "le", 8),
      Buffer.from([1]),
    ],
    JUPITER_PERPETUALS_PROGRAM_ID
  )[0];
  return { positionRequest, counter };
}

async function getSolPrice(): Promise<number> {
  try {
    const resp = await fetch("https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d");
    const data = await resp.json() as any;
    const priceData = data.parsed[0].price;
    return parseFloat(priceData.price) / Math.pow(10, -priceData.expo);
  } catch {
    return 85;
  }
}

export async function openPosition(side: "long" | "short", collateralUsd: number, leverage: number, walletPath: string) {
  try {
    const wallet = loadWallet(walletPath);
    const sizeUsd = collateralUsd * leverage;

    const custodyPubkey = new PublicKey(CUSTODY_PUBKEY.SOL);
    const collateralCustodyPubkey = side === "long"
      ? new PublicKey(CUSTODY_PUBKEY.SOL)
      : new PublicKey(CUSTODY_PUBKEY.USDC);

    const inputMint = side === "long" ? NATIVE_MINT : USDC_MINT;

    let collateralTokenDelta: BN;
    if (side === "long") {
      const solPrice = await getSolPrice();
      const solAmount = collateralUsd / solPrice;
      collateralTokenDelta = new BN(Math.floor(solAmount * Math.pow(10, SOL_DECIMALS)));
    } else {
      collateralTokenDelta = new BN(Math.floor(collateralUsd * Math.pow(10, USDC_DECIMALS)));
    }

    const positionPubkey = generatePositionPda(wallet.publicKey, custodyPubkey, collateralCustodyPubkey, side);
    const { positionRequest, counter } = generatePositionRequestPda(positionPubkey);
    const positionRequestAta = getAssociatedTokenAddressSync(inputMint, positionRequest, true);
    const fundingAccount = getAssociatedTokenAddressSync(inputMint, wallet.publicKey);

    const preInstructions: TransactionInstruction[] = [];
    const postInstructions: TransactionInstruction[] = [];

    if (inputMint.equals(NATIVE_MINT)) {
      preInstructions.push(
        createAssociatedTokenAccountIdempotentInstruction(wallet.publicKey, fundingAccount, wallet.publicKey, NATIVE_MINT)
      );
      preInstructions.push(
        SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: fundingAccount, lamports: BigInt(collateralTokenDelta.toString()) })
      );
      preInstructions.push(createSyncNativeInstruction(fundingAccount));
      postInstructions.push(createCloseAccountInstruction(fundingAccount, wallet.publicKey, wallet.publicKey));
    }

    const solPrice = await getSolPrice();
    const priceSlippage = side === "long"
      ? new BN(Math.floor(solPrice * 1.10 * Math.pow(10, USDC_DECIMALS)))
      : new BN(Math.floor(solPrice * 0.90 * Math.pow(10, USDC_DECIMALS)));

    const increaseIx = await JUPITER_PERPETUALS_PROGRAM.methods
      .createIncreasePositionMarketRequest({
        counter,
        collateralTokenDelta,
        jupiterMinimumOut: null,
        priceSlippage,
        side: side === "long" ? { long: {} } : { short: {} },
        sizeUsdDelta: new BN(Math.floor(sizeUsd * Math.pow(10, USDC_DECIMALS))),
      })
      .accounts({
        custody: custodyPubkey,
        collateralCustody: collateralCustodyPubkey,
        fundingAccount,
        inputMint,
        owner: wallet.publicKey,
        perpetuals: PublicKey.findProgramAddressSync([Buffer.from("perpetuals")], JUPITER_PERPETUALS_PROGRAM_ID)[0],
        pool: JLP_POOL_ACCOUNT_PUBKEY,
        position: positionPubkey,
        positionRequest,
        positionRequestAta,
        referral: null,
      })
      .instruction();

    const instructions = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100000 }),
      ...preInstructions,
      increaseIx,
      ...postInstructions,
    ];

    const { blockhash } = await RPC_CONNECTION.getLatestBlockhash("confirmed");
    const tx = new VersionedTransaction(
      new TransactionMessage({ payerKey: wallet.publicKey, recentBlockhash: blockhash, instructions }).compileToV0Message()
    );

    tx.sign([wallet]);
    const signature = await RPC_CONNECTION.sendTransaction(tx, { skipPreflight: true });

    return { success: true, side, sizeUsd, collateralUsd, leverage, solPrice, positionPubkey: positionPubkey.toString(), tx: signature, txUrl: `https://solscan.io/tx/${signature}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
