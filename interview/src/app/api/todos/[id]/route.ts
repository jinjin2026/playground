import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { todos } from "@/db/schema";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/todos/[id]">,
) {
  const { id } = await ctx.params;
  const todoId = Number(id);

  if (!Number.isInteger(todoId)) {
    return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
  }

  const body = await request.json();
  const { content, done } = body as { content?: string; done?: boolean };

  const updates: Partial<{ content: string; done: boolean }> = {};
  if (content !== undefined) updates.content = content;
  if (done !== undefined) updates.done = done;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "content or done is required" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(todos)
    .set(updates)
    .where(eq(todos.id, todoId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/todos/[id]">,
) {
  const { id } = await ctx.params;
  const todoId = Number(id);

  if (!Number.isInteger(todoId)) {
    return NextResponse.json({ error: "Invalid todo id" }, { status: 400 });
  }

  const [deleted] = await db
    .delete(todos)
    .where(eq(todos.id, todoId))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  return NextResponse.json(deleted);
}
