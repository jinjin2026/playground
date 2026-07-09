CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
