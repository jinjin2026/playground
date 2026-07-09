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
    <div className="min-h-screen bg-neutral-950 px-6 py-16 font-sans text-white">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight italic">
            The Smart Calendar
          </h1>
          <p className="mt-1 text-zinc-400">{allEvents.length}개의 일정</p>
        </div>

        <CalendarView
          events={calendarEvents}
          initialMonth={new Date().toISOString()}
        />
      </main>
    </div>
  );
}
