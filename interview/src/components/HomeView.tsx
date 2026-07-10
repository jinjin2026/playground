import type { Todo } from "@/db/schema";
import { TodoList } from "./TodoList";
import { ScheduleLinkCard } from "./ScheduleLinkCard";

export function HomeView({
  date,
  initialTodos,
}: {
  date: Date;
  initialTodos: Todo[];
}) {
  return (
    <div className="flex flex-col gap-6 lg:max-w-md">
      <TodoList date={date} initialTodos={initialTodos} />
      <ScheduleLinkCard date={date} />
    </div>
  );
}
