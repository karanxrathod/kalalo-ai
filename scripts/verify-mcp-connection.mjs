import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("[MCP Verification] Initializing STDIO client connection test...");

  const serverScript = path.resolve(process.cwd(), "dist", "index.js");
  console.log(`[MCP Verification] Launching server process: node ${serverScript}`);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverScript],
  });

  const client = new Client(
    { name: "kalalo-verification-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    console.log("[MCP Verification] Connecting client to server transport...");
    await client.connect(transport);
    console.log("[MCP Verification] Connected successfully over STDIO JSON-RPC!");

    console.log("[MCP Verification] Calling client.listTools()...");
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools || [];

    console.log(`\n================ REGISTERED MCP TOOLS (${tools.length}) ================`);
    tools.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}`);
      console.log(`   Description: ${t.description}`);
    });
    console.log("================================================================\n");

    if (tools.length !== 9) {
      throw new Error(`Expected exactly 9 registered tools, but found ${tools.length}`);
    }

    console.log("[MCP Verification] All 9 canonical tools verified!");
    await client.close();
    console.log("[MCP Verification] Client closed cleanly.");
  } catch (err) {
    console.error("\n[MCP Verification FAILURE] Complete error details:");
    if (err instanceof Error) {
      console.error(`Name: ${err.name}`);
      console.error(`Message: ${err.message}`);
      console.error(`Stack trace:\n${err.stack}`);
    } else {
      console.error(String(err));
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[Fatal Error]", err);
  process.exit(1);
});
