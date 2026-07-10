import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { todos, userLocation } from "@/db/schema";
import { todayDateParam } from "@/lib/date-utils";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const today = todayDateParam();

  const [todayTodos, [location]] = await Promise.all([
    db
      .select()
      .from(todos)
      .where(eq(todos.date, today))
      .orderBy(asc(todos.createdAt)),
    db.select().from(userLocation).limit(1),
  ]);

  return (
    <Dashboard
      initialTodos={todayTodos}
      initialLocation={
        location
          ? {
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
            }
          : null
      }
      initialDate={today}
    />
  );
}
