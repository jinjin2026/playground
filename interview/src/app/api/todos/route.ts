import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { todayDateParam } from "@/lib/date-utils";
import { createCalendarEvent, todoAllDayRange } from "@/lib/mcp-calendar-client";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayDateParam();

  const dayTodos = await db
    .select()
    .from(todos)
    .where(eq(todos.date, date))
    .orderBy(asc(todos.createdAt));

  return NextResponse.json(dayTodos);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, date } = body as { content?: string; date?: string };

  if (!content) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 },
    );
  }

  const todoDate = date ?? todayDateParam();

  const [created] = await db
    .insert(todos)
    .values({ content, date: todoDate })
    .returning();

  const calendarEvent = await createCalendarEvent({
    title: `✅ 할 일: ${content}`,
    ...todoAllDayRange(todoDate),
  });

  if (!calendarEvent) {
    return NextResponse.json(created, { status: 201 });
  }

  const [linked] = await db
    .update(todos)
    .set({ calendarEventId: calendarEvent.id })
    .where(eq(todos.id, created.id))
    .returning();

  return NextResponse.json(linked, { status: 201 });
}
