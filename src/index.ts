#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createKalaloServer } from "./server.js";

async function main(): Promise<void> {
  // Output status/diagnostics ONLY to stderr to prevent stdio transport corruption
  process.stderr.write("[Kalalo] Initializing Kalalo AI Captioning MCP Server...\n");

  const server = createKalaloServer();
  const transport = new StdioServerTransport();

  process.on("SIGINT", async () => {
    process.stderr.write("[Kalalo] Shutting down server gracefully (SIGINT)...\n");
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    process.stderr.write("[Kalalo] Shutting down server gracefully (SIGTERM)...\n");
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  process.stderr.write("[Kalalo] MCP Server connected via STDIO transport and listening for requests.\n");
}

main().catch((err) => {
  process.stderr.write(`[Kalalo Fatal Error] ${err instanceof Error ? err.stack || err.message : String(err)}\n`);
  process.exit(1);
});
