CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`token` text NOT NULL,
	`name` text NOT NULL,
	`card` text NOT NULL,
	`marks` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` integer NOT NULL
);
