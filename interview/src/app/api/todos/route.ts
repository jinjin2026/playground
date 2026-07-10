import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { todayDateParam } from "@/lib/date-utils";

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

  const [created] = await db
    .insert(todos)
    .values({ content, date: date ?? todayDateParam() })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
