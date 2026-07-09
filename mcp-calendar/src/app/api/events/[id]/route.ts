import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/events/[id]">,
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

  const [updated] = await db
    .update(events)
    .set({ title, start: startDate, end: endDate })
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/events/[id]">,
) {
  const { id } = await ctx.params;
  const eventId = Number(id);

  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "Invalid event id" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, eventId))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(deleted);
}
