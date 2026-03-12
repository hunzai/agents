import axios from "axios";
import { TOKEN_ADDRESSES, TOKEN_DECIMALS } from "../types/index.js";

export class BalanceService {
  constructor(private rpcUrl: string) {}

  async getSOLBalance(walletAddress: string): Promise<number> {
    const response = await axios.post(this.rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "getBalance",
      params: [walletAddress],
    });

    if (response.data.error) {
      throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
    }

    const lamports = response.data.result.value;
    return lamports / Math.pow(10, TOKEN_DECIMALS.SOL);
  }

  async getUSDCBalance(walletAddress: string): Promise<number> {
    const response = await axios.post(this.rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        walletAddress,
        { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { encoding: "jsonParsed" },
      ],
    });

    if (response.data.error) {
      throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
    }

    const accounts = response.data.result?.value || [];
    const account = accounts.find(
      (acc: any) =>
        acc.account.data.parsed.info.mint === TOKEN_ADDRESSES.USDC
    );

    if (!account) return 0;

    return parseFloat(
      account.account.data.parsed.info.tokenAmount.uiAmountString
    );
  }
}
