import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000";

type ApiEvent = {
  id: number;
  title: string;
  start: string;
  end: string;
  createdAt: string;
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
  name: "mcp-calendar",
  version: "0.1.0",
});

server.registerTool(
  "event_create",
  {
    title: "Create event",
    description:
      "Create a new calendar event by calling the Next.js /api/events endpoint.",
    inputSchema: {
      title: z.string().describe("Event title"),
      start: z.string().describe("Event start time as an ISO 8601 datetime"),
      end: z.string().describe("Event end time as an ISO 8601 datetime"),
    },
  },
  async ({ title, start, end }) => {
    const created = (await apiFetch("/api/events", {
      method: "POST",
      body: JSON.stringify({ title, start, end }),
    })) as ApiEvent;

    return {
      content: [
        { type: "text", text: JSON.stringify(created, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "event_delete",
  {
    title: "Delete event",
    description:
      "Delete a calendar event by id by calling the Next.js /api/events/:id endpoint.",
    inputSchema: {
      id: z.number().int().describe("Id of the event to delete"),
    },
  },
  async ({ id }) => {
    const deleted = (await apiFetch(`/api/events/${id}`, {
      method: "DELETE",
    })) as ApiEvent;

    return {
      content: [
        { type: "text", text: JSON.stringify(deleted, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "event_list",
  {
    title: "List events",
    description:
      "List events from the local calendar app by calling the Next.js /api/events endpoint.",
    inputSchema: {},
  },
  async () => {
    const localEvents = (await apiFetch("/api/events")) as ApiEvent[];

    return {
      content: [
        { type: "text", text: JSON.stringify(localEvents, null, 2) },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Failed to start mcp-calendar MCP server:", error);
  process.exit(1);
});
