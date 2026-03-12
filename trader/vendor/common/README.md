# openclaw-common

Shared helpers for OpenClaw extensions (leverage, swap).

- **loadWallet(walletPath)** — Load Solana Keypair from wallet JSON: `{ "publicKey": "<base58>", "secretKey": [ ... 64 bytes ] }`
- **getSolanaConfig()** — Read `RPC_URL`/`SOLANA_RPC_URL` and `WALLET_PATH` from env; throws if missing
- **toolSuccess(result)** / **toolError(err)** — OpenClaw tool response content shape

Used by: `extensions/leverage`, `extensions/swap`.

Build: `npm run build` (emits ESM + CJS).
