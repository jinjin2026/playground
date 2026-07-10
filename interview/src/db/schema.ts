import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),
  content: text("content").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  calendarEventId: integer("calendar_event_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const userLocation = sqliteTable("user_location", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const weatherNewsCache = sqliteTable("weather_news_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  rawHeadline: text("raw_headline").notNull(),
  plainSummary: text("plain_summary").notNull(),
  sourceUrl: text("source_url").notNull(),
  fetchedAt: integer("fetched_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
export type UserLocation = typeof userLocation.$inferSelect;
export type NewUserLocation = typeof userLocation.$inferInsert;
export type WeatherNewsCache = typeof weatherNewsCache.$inferSelect;
export type NewWeatherNewsCache = typeof weatherNewsCache.$inferInsert;
