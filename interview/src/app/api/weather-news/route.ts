import { NextRequest, NextResponse } from "next/server";
import { getWeatherNewsForDate } from "@/lib/weather-news";
import { todayDateParam } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? todayDateParam();
  const news = await getWeatherNewsForDate(date);
  return NextResponse.json(news);
}
