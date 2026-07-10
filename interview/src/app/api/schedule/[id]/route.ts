import { NextResponse } from "next/server";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/mcp-calendar-client";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/schedule/[id]">,
) {
  const { id } = await ctx.params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const body = await request.json();
  const { title, start, end } = body as {
    title?: string;
    start?: string;
    end?: string;
  };

  if (!title || !start || !end) {
    return NextResponse.json(
      { error: "title, start, and end are required" },
      { status: 400 },
    );
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: "start and end must be valid dates" },
      { status: 400 },
    );
  }

  const updated = await updateCalendarEvent(eventId, {
    title,
    start: startDate,
    end: endDate,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "mcp-calendar에 연결할 수 없어요" },
      { status: 502 },
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/schedule/[id]">,
) {
  const { id } = await ctx.params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const ok = await deleteCalendarEvent(eventId);

  if (!ok) {
    return NextResponse.json(
      { error: "mcp-calendar에 연결할 수 없어요" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
