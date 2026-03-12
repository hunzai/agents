import { PublicKey } from "@solana/web3.js";
import { JUPITER_PERPETUALS_PROGRAM } from "../constants.js";
import { BNToUSDRepresentation } from "../utils.js";

export async function listPositions(walletAddress: string) {
  try {
    const positions = await JUPITER_PERPETUALS_PROGRAM.provider.connection.getProgramAccounts(
      JUPITER_PERPETUALS_PROGRAM.programId,
      {
        commitment: "confirmed",
        filters: [
          { memcmp: { bytes: new PublicKey(walletAddress).toBase58(), offset: 8 } },
          { memcmp: JUPITER_PERPETUALS_PROGRAM.coder.accounts.memcmp("position") },
        ],
      }
    );

    const openPositions = positions
      .map(item => ({
        pubkey: item.pubkey.toString(),
        account: JUPITER_PERPETUALS_PROGRAM.coder.accounts.decode("position", item.account.data),
      }))
      .filter(p => p.account.sizeUsd.gtn(0))
      .map(p => ({
        pubkey: p.pubkey,
        side: p.account.side.long ? "long" : "short",
        entryPrice: BNToUSDRepresentation(p.account.price, 6),
        sizeUsd: BNToUSDRepresentation(p.account.sizeUsd, 6),
        collateralUsd: BNToUSDRepresentation(p.account.collateralUsd, 6),
        openTime: new Date(p.account.openTime.toNumber() * 1000).toISOString(),
      }));

    return { success: true, positions: openPositions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
