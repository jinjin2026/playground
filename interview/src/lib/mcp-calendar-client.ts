import { isSameDay } from "./date-utils";

const MCP_CALENDAR_URL =
  process.env.NEXT_PUBLIC_MCP_CALENDAR_URL ?? "http://localhost:3000";

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
