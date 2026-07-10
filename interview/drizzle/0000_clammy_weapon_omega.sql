CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`content` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_location` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `weather_news_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`raw_headline` text NOT NULL,
	`plain_summary` text NOT NULL,
	`source_url` text NOT NULL,
	`fetched_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `weather_news_cache_date_unique` ON `weather_news_cache` (`date`);