import type { Todo } from "@/db/schema";
import { TodoList } from "./TodoList";
import { ScheduleLinkCard } from "./ScheduleLinkCard";
import { LocationSearch } from "./LocationSearch";
import { WeatherCard, type SavedLocation } from "./WeatherCard";
import { NewsHeadline } from "./NewsHeadline";

export function HomeView({
  date,
  initialTodos,
  location,
  onLocationChange,
}: {
  date: Date;
  initialTodos: Todo[];
  location: SavedLocation | null;
  onLocationChange: (location: SavedLocation) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <TodoList date={date} initialTodos={initialTodos} />
        <ScheduleLinkCard date={date} />
      </div>
      <div className="flex flex-col gap-6">
        <LocationSearch location={location} onLocationChange={onLocationChange} />
        <WeatherCard date={date} location={location} />
        <NewsHeadline date={date} />
      </div>
    </div>
  );
}
