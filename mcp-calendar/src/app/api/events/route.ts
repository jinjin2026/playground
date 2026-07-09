import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";

export async function GET() {
  const allEvents = await db.select().from(events).orderBy(asc(events.start));
  return NextResponse.json(allEvents);
}

export async function POST(request: NextRequest) {
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

  const [created] = await db
    .insert(events)
    .values({ title, start: startDate, end: endDate })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
