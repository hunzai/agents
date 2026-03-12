/**
 * Price - OpenClaw Plugin. Analysis from price history file; historical from CoinGecko.
 */

import { historicalCommand } from "./src/commands/historical.js";
import { analysisCommand } from "./src/commands/analysis.js";

export default function register(api: any) {
  api.registerTool({
    name: "price",
    description:
      "Price data: 'analysis' (read price history file, compare last price to min/max in last N minutes) or 'historical' (CoinGecko market_chart by coin id).",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command: analysis | historical" },
        historyPath: { type: "string", description: "For analysis: path to price history file (epoch,timestamp,price per line)" },
        minutes: { type: "number", description: "For analysis: last N minutes (default 60, max 43200)" },
        coinId: { type: "string", description: "For historical: coin id (default solana)" },
        days: { type: "number", description: "For historical: days of data (default 1)" },
      },
      required: ["command"],
    },
    async execute(_id: string, params: any) {
      try {
        if (params.command === "analysis") {
          const historyPath = params.historyPath ?? process.env.PRICE_HISTORY_FILE;
          if (!historyPath) throw new Error("analysis requires historyPath or PRICE_HISTORY_FILE");
          const minutes = Math.max(1, Math.min(43200, params.minutes ?? 60));
          const result = await analysisCommand({ historyPath, minutes });
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        if (params.command === "historical") {
          const result = await historicalCommand({
            coinId: params.coinId ?? "solana",
            days: params.days ?? 1,
          });
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        }
        throw new Error("Use command: analysis or historical");
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: false, error: error?.message ?? String(error) },
                null,
                2
              ),
            },
          ],
        };
      }
    },
  });
}
