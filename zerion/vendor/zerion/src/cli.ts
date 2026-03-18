/**
 * Zerion API CLI — portfolio and positions for any wallet across all chains.
 *
 * Usage:
 *   node dist/cli.js portfolio <address> [--currency usd]
 *   node dist/cli.js positions <address> [--currency usd] [--chain <id>] [--sort -value]
 *
 * Env: ZERION_API_KEY (required)
 */

declare const process: { env: Record<string, string | undefined>; argv: string[]; exit(code: number): never };
declare const Buffer: { from(s: string): { toString(enc: string): string } };
declare function fetch(url: string, init?: { headers?: Record<string, string> }): Promise<{ ok: boolean; status: number; text(): Promise<string>; json(): Promise<unknown> }>;

const API_BASE = "https://api.zerion.io/v1";

function getAuth(): string {
  const key = process.env.ZERION_API_KEY;
  if (!key) {
    console.error(JSON.stringify({ success: false, error: "ZERION_API_KEY not set" }));
    process.exit(1);
  }
  return "Basic " + Buffer.from(key + ":").toString("base64");
}

function parseArgs(args: string[]): { command: string; address: string; flags: Record<string, string> } {
  const command = args[0] ?? "help";
  const address = args[1] ?? "";
  const flags: Record<string, string> = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[++i];
    }
  }
  return { command, address, flags };
}

async function apiFetch(path: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: getAuth(),
      accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  }
  return res.json();
}

interface PortfolioData {
  data?: {
    attributes?: {
      total?: { positions?: number };
      changes?: { absolute_1d?: number; percent_1d?: number };
      positions_distribution_by_type?: Record<string, number>;
      positions_distribution_by_chain?: Record<string, number>;
    };
  };
}

async function portfolio(address: string, currency: string) {
  const raw = (await apiFetch(`/wallets/${address}/portfolio`, {
    currency,
    "filter[positions]": "no_filter",
  })) as PortfolioData;

  if (!raw.data) {
    console.log(JSON.stringify({ success: false, error: "No data returned", raw }));
    return;
  }

  const attr = raw.data.attributes!;
  console.log(
    JSON.stringify({
      success: true,
      address,
      currency,
      total_value: attr.total?.positions ?? 0,
      change_1d: attr.changes?.absolute_1d ?? 0,
      change_1d_pct: attr.changes?.percent_1d ?? 0,
      by_type: attr.positions_distribution_by_type ?? {},
      by_chain: attr.positions_distribution_by_chain ?? {},
    })
  );
}

interface Position {
  attributes?: {
    position_type?: string;
    quantity?: { float?: number };
    value?: number;
    price?: number;
    changes?: { absolute_1d?: number; percent_1d?: number };
    fungible_info?: {
      name?: string;
      symbol?: string;
      icon?: { url?: string };
    };
    flags?: { displayable?: boolean; is_trash?: boolean };
  };
  relationships?: {
    chain?: { data?: { id?: string } };
  };
}

interface PositionsResponse {
  data?: Position[];
}

async function positions(address: string, currency: string, chain?: string, sort?: string) {
  const params: Record<string, string> = {
    currency,
    "filter[positions]": "no_filter",
    sort: sort ?? "-value",
  };
  if (chain) params["filter[chain_ids]"] = chain;

  const raw = (await apiFetch(`/wallets/${address}/positions/`, params)) as PositionsResponse;

  if (!raw.data) {
    console.log(JSON.stringify({ success: false, error: "No data returned", raw }));
    return;
  }

  const items = raw.data
    .filter((p) => p.attributes?.flags?.displayable !== false && !p.attributes?.flags?.is_trash)
    .map((p) => ({
      name: p.attributes?.fungible_info?.name ?? "Unknown",
      symbol: p.attributes?.fungible_info?.symbol ?? "???",
      chain: p.relationships?.chain?.data?.id ?? "unknown",
      type: p.attributes?.position_type ?? "wallet",
      quantity: p.attributes?.quantity?.float ?? 0,
      value: p.attributes?.value ?? 0,
      price: p.attributes?.price ?? 0,
      change_1d: p.attributes?.changes?.absolute_1d ?? 0,
      change_1d_pct: p.attributes?.changes?.percent_1d ?? 0,
    }));

  console.log(
    JSON.stringify({
      success: true,
      address,
      currency,
      count: items.length,
      total_value: items.reduce((s, i) => s + i.value, 0),
      positions: items,
    })
  );
}

function printHelp() {
  console.log(`Zerion CLI — multi-chain wallet portfolio

Usage:
  cli.ts portfolio <address> [--currency usd]
  cli.ts positions <address> [--currency usd] [--chain ethereum] [--sort -value]
  cli.ts help

Env: ZERION_API_KEY (required)
`);
}

async function main() {
  const { command, address, flags } = parseArgs(process.argv.slice(2));
  const currency = flags.currency ?? "usd";

  switch (command) {
    case "portfolio":
      if (!address) { console.error("Address required"); process.exit(1); }
      await portfolio(address, currency);
      break;
    case "positions":
      if (!address) { console.error("Address required"); process.exit(1); }
      await positions(address, currency, flags.chain, flags.sort);
      break;
    default:
      printHelp();
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ success: false, error: String(e) }));
  process.exit(1);
});
