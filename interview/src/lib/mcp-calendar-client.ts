import { isSameDay } from "./date-utils";

// Server-side calls need the docker-network address (e.g. http://mcp-calendar:3000),
// which differs from NEXT_PUBLIC_MCP_CALENDAR_URL — that one is baked into the
// client bundle and must stay a browser-reachable URL (e.g. http://localhost:3102).
const MCP_CALENDAR_URL =
  process.env.MCP_CALENDAR_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_MCP_CALENDAR_URL ??
  "http://localhost:3000";

export type SchedulePreviewItem = {
  id: number;
  title: string;
  start: string;
  end: string;
};

export async function fetchTodaySchedulePreview(
  date: string,
): Promise<SchedulePreviewItem[] | null> {
  try {
    const res = await fetch(`${MCP_CALENDAR_URL}/api/events`, {
      cache: "no-store",
    });
    if (!res.ok) return null;

    const events = (await res.json()) as SchedulePreviewItem[];
    const targetDate = new Date(`${date}T00:00:00`);

    return events
      .filter((event) => isSameDay(new Date(event.start), targetDate))
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    return null;
  }
}

export type CalendarEventInput = { title: string; start: Date; end: Date };

// A todo has no time of its own, so it's mirrored into mcp-calendar as an
// all-day entry for its date rather than a timed appointment.
export function todoAllDayRange(date: string): { start: Date; end: Date } {
  return {
    start: new Date(`${date}T00:00:00`),
    end: new Date(`${date}T23:59:59`),
  };
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<SchedulePreviewItem | null> {
  try {
    const res = await fetch(`${MCP_CALENDAR_URL}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        start: input.start.toISOString(),
        end: input.end.toISOString(),
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SchedulePreviewItem;
  } catch {
    return null;
  }
}

export async function updateCalendarEvent(
  id: number,
  input: CalendarEventInput,
): Promise<SchedulePreviewItem | null> {
  try {
    const res = await fetch(`${MCP_CALENDAR_URL}/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: input.title,
        start: input.start.toISOString(),
        end: input.end.toISOString(),
      }),
    });
    if (!res.ok) return null;
    return (await res.json()) as SchedulePreviewItem;
  } catch {
    return null;
  }
}

export async function deleteCalendarEvent(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${MCP_CALENDAR_URL}/api/events/${id}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}
