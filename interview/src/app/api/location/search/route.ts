import { NextRequest, NextResponse } from "next/server";
import { searchLocations } from "@/lib/location";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "q query param is required" },
      { status: 400 },
    );
  }

  const results = await searchLocations(q);
  return NextResponse.json(results);
}
