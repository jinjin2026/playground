import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userLocation } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const [location] = await db.select().from(userLocation).limit(1);
  return NextResponse.json(location ?? null);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { name, latitude, longitude } = body as {
    name?: string;
    latitude?: number;
    longitude?: number;
  };

  if (
    !name ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return NextResponse.json(
      { error: "name, latitude, and longitude are required" },
      { status: 400 },
    );
  }

  const [existing] = await db.select().from(userLocation).limit(1);

  if (existing) {
    const [updated] = await db
      .update(userLocation)
      .set({ name, latitude, longitude })
      .where(eq(userLocation.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(userLocation)
    .values({ name, latitude, longitude })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
