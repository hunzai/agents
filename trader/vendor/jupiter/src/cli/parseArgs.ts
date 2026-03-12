/**
 * Parse argv into positionals and named params (--key=value or --key value).
 * Shared by perps and swap CLI runners.
 */

export interface ParsedArgs {
  positionals: string[];
  params: Record<string, string>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const params: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq > 2) {
        const key = arg.slice(2, eq).replace(/-/g, "_");
        params[key] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2).replace(/-/g, "_");
        if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
          params[key] = argv[i + 1];
          i++;
        } else {
          params[key] = "true";
        }
      }
    } else {
      positionals.push(arg);
    }
  }
  return { positionals, params };
}

export function getParam(params: Record<string, string>, name: string): string | undefined {
  return params[name] ?? params[name.replace(/_/g, "-")];
}

export function getWalletPath(params: Record<string, string>): string | undefined {
  return getParam(params, "wallet_path") ?? process.env.WALLET_PATH;
}
