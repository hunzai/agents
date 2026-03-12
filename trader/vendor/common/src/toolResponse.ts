/**
 * OpenClaw tool response helpers: same content shape used by leverage and swap plugins.
 */

export function toolSuccess(result: unknown): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
}

export function toolError(err: Error | string): { content: Array<{ type: "text"; text: string }> } {
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ success: false, error: message }, null, 2),
      },
    ],
  };
}
