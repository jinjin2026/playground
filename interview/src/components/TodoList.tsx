"use client";

import { useEffect, useState } from "react";
import { toDateParam } from "@/lib/date-utils";
import type { Todo } from "@/db/schema";

type TodoListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; todos: Todo[] };

export function TodoList({
  date,
  initialTodos,
}: {
  date: Date;
  initialTodos: Todo[];
}) {
  const [state, setState] = useState<TodoListState>({
    status: "ready",
    todos: initialTodos,
  });
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    fetch(`/api/todos?date=${toDateParam(date)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: Todo[]) => {
        if (cancelled) return;
        setState({ status: "ready", todos: data });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  async function handleAdd() {
    if (!content.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), date: toDateParam(date) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "추가 실패");

      setState((prev) =>
        prev.status === "ready"
          ? { status: "ready", todos: [...prev.todos, data] }
          : { status: "ready", todos: [data] },
      );
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo: Todo) {
    if (state.status !== "ready") return;
    const prevTodos = state.todos;
    setState({
      status: "ready",
      todos: prevTodos.map((t) =>
        t.id === todo.id ? { ...t, done: !t.done } : t,
      ),
    });

    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !todo.done }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setState({ status: "ready", todos: prevTodos });
      setError("업데이트 실패");
    }
  }

  async function handleDelete(id: number) {
    if (state.status !== "ready") return;
    const prevTodos = state.todos;
    setState({
      status: "ready",
      todos: prevTodos.filter((t) => t.id !== id),
    });

    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setState({ status: "ready", todos: prevTodos });
      setError("삭제 실패");
    }
  }

  return (
    <div className="flex flex-col rounded-[20px] border border-white/[0.09] bg-white/[0.045] p-6 text-[#eef2f0] shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <h2 className="font-heading text-[17px] font-semibold text-[#f6f8f7]">
        할 일
      </h2>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          name="todo-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="할 일 추가"
          className="flex-1 rounded-full bg-white/[0.06] px-4 py-2.5 text-sm text-[#eef2f0] outline-none placeholder:text-white/35 focus:ring-1 focus:ring-emerald-400/60"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !content.trim()}
          className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#3fd8a6] to-[#2ea888] px-4.5 py-2.5 text-[13px] font-semibold text-[#06231a] transition hover:brightness-110 disabled:opacity-50"
        >
          추가
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 flex flex-col">
        {state.status === "loading" && (
          <p className="py-4 text-sm text-white/40">불러오는 중...</p>
        )}
        {state.status === "error" && (
          <p className="py-4 text-sm text-red-400">할 일을 불러오지 못했어요.</p>
        )}
        {state.status === "ready" && state.todos.length === 0 && (
          <p className="py-4 text-sm text-white/40">오늘 할 일이 없어요.</p>
        )}
        {state.status === "ready" &&
          state.todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 border-t border-white/[0.07] py-2.5 first:border-t-0"
            >
              <button
                onClick={() => handleToggle(todo)}
                className={`h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] transition ${
                  todo.done
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-white/30 bg-transparent"
                }`}
              />
              <span
                className={`flex-1 text-sm ${
                  todo.done ? "text-white/35 line-through" : "text-[#eef2f0]"
                }`}
              >
                {todo.content}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-xs text-white/30 transition hover:text-red-400"
              >
                삭제
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
