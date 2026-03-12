import { Keypair, VersionedTransaction } from "@solana/web3.js";
import axios from "axios";

export class TransactionService {
  constructor(private rpcUrl: string) {}

  async sendAndConfirm(
    swapTransaction: string,
    keypair: Keypair
  ): Promise<string> {
    const txBuffer = Buffer.from(swapTransaction, "base64");
    const transaction = VersionedTransaction.deserialize(txBuffer);

    transaction.sign([keypair]);

    const serializedTx = transaction.serialize();
    const response = await axios.post(this.rpcUrl, {
      jsonrpc: "2.0",
      id: 1,
      method: "sendTransaction",
      params: [
        Buffer.from(serializedTx).toString("base64"),
        {
          encoding: "base64",
          skipPreflight: false,
          preflightCommitment: "confirmed",
        },
      ],
    });

    if (response.data.error) {
      throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
    }

    const signature = response.data.result;
    await this.confirmTransaction(signature);
    return signature;
  }

  private async confirmTransaction(signature: string): Promise<void> {
    for (let i = 0; i < 30; i++) {
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: "2.0",
        id: 1,
        method: "getSignatureStatuses",
        params: [[signature], { searchTransactionHistory: true }],
      });

      if (response.data.error) {
        throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
      }

      const status = response.data.result.value[0];

      if (status) {
        if (status.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }
        if (
          status.confirmationStatus === "confirmed" ||
          status.confirmationStatus === "finalized"
        ) {
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Transaction confirmation timeout");
  }
}
