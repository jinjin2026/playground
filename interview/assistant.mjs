import { query } from "@anthropic-ai/claude-agent-sdk";

const question = process.argv[2];
if (!question) {
  console.error('Usage: node assistant.mjs "질문"');
  process.exit(1);
}

// docker-compose.yml maps the mcp service to host port 3102. Override with
// MCP_SERVER_URL if you're running the mcp server directly (npm run mcp)
// instead of through Docker, where it listens on 3002.
const MCP_SERVER_URL = process.env.MCP_SERVER_URL ?? "http://localhost:3102/mcp";

let finalAnswer = null;

for await (const message of query({
  prompt: question,
  options: {
    mcpServers: {
      interview: {
        type: "http",
        url: MCP_SERVER_URL,
      },
    },
    // Auto-approve every tool this server exposes (todo_create, location_set,
    // today_briefing_get) so the agent can call them without a permission prompt.
    allowedTools: ["mcp__interview__*"],
  },
})) {
  if (message.type === "system" && message.subtype === "init") {
    const failed = message.mcp_servers.filter((s) => s.status !== "connected");
    if (failed.length > 0) {
      console.error(`MCP 서버 연결 실패 (${MCP_SERVER_URL}):`, failed);
      process.exit(1);
    }
  }

  if (message.type === "result") {
    if (message.subtype === "success") {
      finalAnswer = message.result;
    } else {
      console.error("에이전트 실행 실패:", message.subtype);
      process.exit(1);
    }
  }
}

console.log(finalAnswer);
