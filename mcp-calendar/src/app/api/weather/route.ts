import { NextRequest, NextResponse } from "next/server";
import { fetchDailyWeather } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json(
      { error: "date query param is required" },
      { status: 400 },
    );
  }

  const date = new Date(dateParam);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const weather = await fetchDailyWeather(date);
  if (!weather) {
    return NextResponse.json({ error: "weather unavailable" }, { status: 502 });
  }

  return NextResponse.json(weather);
}
