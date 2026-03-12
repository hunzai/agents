import axios from "axios";
import type { JupiterQuote } from "../types/index.js";

export class JupiterAPI {
  constructor(
    private baseUrl: string,
    private apiKey?: string
  ) {}

  private getHeaders() {
    if (!this.apiKey) {
      return {};
    }
    return {
      "x-api-key": this.apiKey,
    };
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number
  ): Promise<JupiterQuote> {
    const url = `${this.baseUrl}/swap/v1/quote`;
    const params = { inputMint, outputMint, amount, slippageBps };

    try {
      const response = await axios.get(url, {
        params,
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error(
          "Rate limit exceeded (1 RPS). Wait 1 second and retry."
        );
      }
      throw error;
    }
  }

  async getSwapTransaction(
    quote: JupiterQuote,
    userPublicKey: string
  ): Promise<string> {
    const url = `${this.baseUrl}/swap/v1/swap`;
    const response = await axios.post(
      url,
      {
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
      },
      {
        headers: this.getHeaders(),
      }
    );

    return response.data.swapTransaction;
  }
}
