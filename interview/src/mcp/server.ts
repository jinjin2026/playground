import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

type ApiTodo = {
  id: number;
  date: string;
  content: string;
  done: boolean;
  createdAt: string;
};

type ApiLocation = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request to ${path} failed with status ${res.status}`;
    throw new Error(message);
  }

  return body;
}

const server = new McpServer({
  name: "interview",
  version: "0.1.0",
});

server.registerTool(
  "todo_create",
  {
    title: "Create todo",
    description:
      "Create a new todo item for a given date (defaults to today) by calling the Next.js /api/todos endpoint.",
    inputSchema: {
      content: z.string().describe("Todo content"),
      date: z
        .string()
        .optional()
        .describe("Date as YYYY-MM-DD, defaults to today"),
    },
  },
  async ({ content, date }) => {
    const created = (await apiFetch("/api/todos", {
      method: "POST",
      body: JSON.stringify({ content, date }),
    })) as ApiTodo;

    return {
      content: [{ type: "text", text: JSON.stringify(created, null, 2) }],
    };
  },
);

server.registerTool(
  "location_set",
  {
    title: "Set saved location",
    description:
      "Save the location used for weather/advice lookups by calling the Next.js /api/location endpoint.",
    inputSchema: {
      name: z.string().describe("Location display name"),
      latitude: z.number().describe("Latitude"),
      longitude: z.number().describe("Longitude"),
    },
  },
  async ({ name, latitude, longitude }) => {
    const saved = (await apiFetch("/api/location", {
      method: "PUT",
      body: JSON.stringify({ name, latitude, longitude }),
    })) as ApiLocation;

    return {
      content: [{ type: "text", text: JSON.stringify(saved, null, 2) }],
    };
  },
);

server.registerTool(
  "today_briefing_get",
  {
    title: "Get today's briefing",
    description:
      "Get today's todos, weather, weather-based advice, weather news headline, and schedule preview all at once.",
    inputSchema: {
      date: z
        .string()
        .optional()
        .describe("Date as YYYY-MM-DD, defaults to today"),
    },
  },
  async ({ date }) => {
    const resolvedDate = date ?? new Date().toISOString().slice(0, 10);

    const [todos, weather, weatherNews, schedulePreview] = await Promise.all([
      apiFetch(`/api/todos?date=${resolvedDate}`),
      apiFetch(`/api/weather?date=${resolvedDate}`).catch((e) => ({
        error: e instanceof Error ? e.message : "weather unavailable",
      })),
      apiFetch(`/api/weather-news?date=${resolvedDate}`),
      apiFetch(`/api/schedule-preview?date=${resolvedDate}`),
    ]);

    const briefing = { date: resolvedDate, todos, weather, weatherNews, schedulePreview };

    return {
      content: [{ type: "text", text: JSON.stringify(briefing, null, 2) }],
    };
  },
);

async function main() {
  // Stateless: every request is an independent proxy call to the Next.js API,
  // so there's no server-side session state worth keeping between requests.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);

  const port = Number(process.env.MCP_PORT ?? 3002);
  const httpServer = createServer((req, res) => {
    if (req.url === "/mcp") {
      transport.handleRequest(req, res);
      return;
    }
    res.writeHead(404).end();
  });

  httpServer.listen(port, () => {
    console.log(`interview MCP server listening on http://localhost:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error("Failed to start interview MCP server:", error);
  process.exit(1);
});
