import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userLocation } from "@/db/schema";
import { fetchWeatherDetail } from "@/lib/weather";

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

  const [location] = await db.select().from(userLocation).limit(1);
  if (!location) {
    return NextResponse.json({ error: "location not set" }, { status: 400 });
  }

  const detail = await fetchWeatherDetail(
    location.latitude,
    location.longitude,
    date,
  );

  if (!detail) {
    return NextResponse.json(
      { error: "weather detail unavailable" },
      { status: 502 },
    );
  }

  return NextResponse.json(detail);
}
