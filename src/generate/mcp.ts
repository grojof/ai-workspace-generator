/** Known MCP servers the generator can wire up. Add entries here to expand. */
interface McpServerDef {
  command: string;
  args: string[];
  env?: Record<string, string>;
  note: string;
}

const REGISTRY: Record<string, McpServerDef> = {
  context7: {
    command: "npx",
    args: ["-y", "@upstash/context7-mcp"],
    note: "Up-to-date, version-pinned library documentation.",
  },
};

export function knownMcp(id: string): boolean {
  return id in REGISTRY;
}

function serversFor(ids: string[]): Record<string, McpServerDef> {
  const out: Record<string, McpServerDef> = {};
  for (const id of ids) {
    if (REGISTRY[id]) out[id] = REGISTRY[id];
  }
  return out;
}

/** `.mcp.json` for Claude Code (key: `mcpServers`). */
export function buildClaudeMcp(ids: string[]): string {
  const servers = serversFor(ids);
  const mcpServers: Record<string, unknown> = {};
  for (const [id, def] of Object.entries(servers)) {
    mcpServers[id] = { command: def.command, args: def.args, ...(def.env ? { env: def.env } : {}) };
  }
  return JSON.stringify({ mcpServers }, null, 2);
}

/** `.vscode/mcp.json` for VS Code / Copilot (key: `servers`). */
export function buildVscodeMcp(ids: string[]): string {
  const servers = serversFor(ids);
  const out: Record<string, unknown> = {};
  for (const [id, def] of Object.entries(servers)) {
    out[id] = { command: def.command, args: def.args, ...(def.env ? { env: def.env } : {}) };
  }
  return JSON.stringify({ servers: out }, null, 2);
}
