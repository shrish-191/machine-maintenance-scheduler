CREATE TABLE `machines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`status` text DEFAULT 'Running' NOT NULL,
	`maintenance_frequency_days` integer NOT NULL,
	`last_maintenance_date` text,
	`next_due_date` text,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `maintenance_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`machine_id` integer NOT NULL,
	`scheduled_date` text NOT NULL,
	`completed_date` text,
	`status` text DEFAULT 'Pending' NOT NULL,
	`technician_name` text,
	`remarks` text
);
