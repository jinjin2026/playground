import { db } from "./index";
import { todos } from "./schema";

function toDateParam(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function seed() {
  const existing = await db.select().from(todos);
  if (existing.length > 0) {
    console.log("Todos already seeded, skipping.");
    return;
  }

  const today = toDateParam(new Date());

  await db.insert(todos).values([
    { date: today, content: "이메일 확인하기", done: false },
    { date: today, content: "물 마시기", done: false },
  ]);

  console.log("Seeded sample todos.");
}

seed();
