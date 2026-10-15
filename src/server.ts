import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAllTools } from "./tools/register-tools.js";

export function createKalaloServer(): McpServer {
  const server = new McpServer(
    {
      name: "kalalo",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  registerAllTools(server);

  return server;
}
