import { db } from "./index";
import { events } from "./schema";

async function seed() {
  const existing = await db.select().from(events);
  if (existing.length > 0) {
    console.log("Events table already has data, skipping seed.");
    return;
  }

  const now = new Date();
  const oneHour = 60 * 60 * 1000;

  await db.insert(events).values([
    {
      title: "Team Standup",
      start: new Date(now.getTime() + oneHour),
      end: new Date(now.getTime() + 2 * oneHour),
    },
    {
      title: "Product Review",
      start: new Date(now.getTime() + 24 * oneHour),
      end: new Date(now.getTime() + 25 * oneHour),
    },
    {
      title: "MCP Calendar Planning",
      start: new Date(now.getTime() + 48 * oneHour),
      end: new Date(now.getTime() + 50 * oneHour),
    },
  ]);

  console.log("Seeded events table.");
}

seed();
