import { NextRequest, NextResponse } from "next/server";
import { fetchTodaySchedulePreview } from "@/lib/mcp-calendar-client";
import { todayDateParam } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayDateParam();
  const events = await fetchTodaySchedulePreview(date);

  if (events === null) {
    return NextResponse.json({ available: false, events: [] });
  }

  return NextResponse.json({ available: true, events });
}
