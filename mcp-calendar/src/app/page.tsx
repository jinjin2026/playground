import { db } from "@/db";
import { events } from "@/db/schema";
import { asc } from "drizzle-orm";
import { CalendarView } from "@/components/CalendarView";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allEvents = await db.select().from(events).orderBy(asc(events.start));

  const calendarEvents = allEvents.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start.toISOString(),
    end: event.end.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Calendar
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {allEvents.length}개의 일정
          </p>
        </div>

        <CalendarView
          events={calendarEvents}
          initialMonth={new Date().toISOString()}
        />
      </main>
    </div>
  );
}
