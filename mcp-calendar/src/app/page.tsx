import { db } from "@/db";
import { events } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatRange(start: Date, end: Date) {
  return `${dateFormatter.format(start)} - ${dateFormatter.format(end)}`;
}

export default async function Home() {
  const allEvents = await db.select().from(events).orderBy(asc(events.start));

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Events
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {allEvents.length} upcoming event{allEvents.length === 1 ? "" : "s"}
          </p>
        </div>

        {allEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No events yet.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {allEvents.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="font-medium text-black dark:text-zinc-50">
                  {event.title}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatRange(event.start, event.end)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
