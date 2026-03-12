import { Keypair } from "@solana/web3.js";
import { readFileSync } from "fs";

const SECRET_KEY_LENGTH = 64;

/**
 * Load a Solana keypair from a wallet JSON file (e.g. WALLET_PATH).
 * Supports two formats:
 *   - Solana CLI format: [ ...64 bytes ]  (raw array)
 *   - Object format:     { "publicKey": "<base58>", "secretKey": [ ...64 bytes ] }
 */
export function loadWallet(walletPath: string): Keypair {
  const raw = JSON.parse(readFileSync(walletPath, "utf-8"));

  let secretKeyArray: number[];

  if (Array.isArray(raw)) {
    // Standard Solana CLI keypair format: raw 64-byte array
    secretKeyArray = raw as number[];
  } else if (raw && Array.isArray(raw.secretKey)) {
    // Object format with explicit secretKey field
    secretKeyArray = raw.secretKey as number[];
  } else {
    throw new Error(
      "Wallet file must be a Solana keypair: a 64-byte array or { \"secretKey\": [ ...64 bytes ] }"
    );
  }

  const bytes = Uint8Array.from(secretKeyArray);
  if (bytes.length !== SECRET_KEY_LENGTH) {
    throw new Error(
      `Wallet secretKey must be 64 bytes (got ${bytes.length}).`
    );
  }

  return Keypair.fromSecretKey(bytes);
}
