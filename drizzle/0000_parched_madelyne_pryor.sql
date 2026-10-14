CREATE TABLE `api_sync_metadata` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`level` varchar(20) NOT NULL,
	`region_scope` varchar(20) NOT NULL,
	`commodity_count` int DEFAULT 0,
	`row_count` int DEFAULT 0,
	`period_from` char(7),
	`period_to` char(7),
	`last_checked_at` timestamp,
	`last_synced_at` timestamp,
	`last_sync_status` varchar(32),
	`credits_estimated` int DEFAULT 0,
	CONSTRAINT `api_sync_metadata_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_sync_scope_idx` UNIQUE(`level`,`region_scope`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(200) NOT NULL,
	`category` varchar(50) NOT NULL,
	`source_name` varchar(100) NOT NULL,
	`content` text NOT NULL,
	`commodity_id` int,
	`published_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`actor_id` varchar(36),
	`action` varchar(64) NOT NULL,
	`target_type` varchar(64) NOT NULL,
	`target_id` varchar(64),
	`metadata_json` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commodities` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`api_name` varchar(120) NOT NULL,
	`display_name` varchar(120) NOT NULL,
	`category` enum('pokok','bumbu','protein','minyak_gula','lainnya') NOT NULL,
	`unit` varchar(20) NOT NULL DEFAULT 'per kg',
	`icon` varchar(16),
	`has_consumer_national` boolean NOT NULL DEFAULT false,
	`has_consumer_prov` boolean NOT NULL DEFAULT false,
	`has_producer_national` boolean NOT NULL DEFAULT false,
	`has_producer_prov` boolean NOT NULL DEFAULT false,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `commodities_id` PRIMARY KEY(`id`),
	CONSTRAINT `commodities_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `commodities_api_name_unique` UNIQUE(`api_name`)
);
--> statement-breakpoint
CREATE TABLE `commodity_anomalies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`commodity_id` int NOT NULL,
	`period_month` char(7) NOT NULL,
	`qipa` decimal(8,3),
	`aipa` decimal(8,3),
	`ifpa` decimal(8,3),
	`status` varchar(40),
	`severity` enum('normal','warning','alert_low','alert_high') NOT NULL DEFAULT 'normal',
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commodity_anomalies_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_commodity_anomaly_idx` UNIQUE(`commodity_id`,`period_month`)
);
--> statement-breakpoint
CREATE TABLE `commodity_prices` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`commodity_id` int NOT NULL,
	`level` enum('konsumen','produsen') NOT NULL,
	`region_scope` enum('nasional','provinsi') NOT NULL,
	`province_code` varchar(4),
	`period_month` char(7) NOT NULL,
	`price` int,
	`price_raw` varchar(32),
	`mom_change_pct` decimal(6,2),
	`yoy_change_pct` decimal(6,2),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commodity_prices_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_price_record_idx` UNIQUE(`commodity_id`,`level`,`region_scope`,`province_code`,`period_month`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`title` varchar(160) NOT NULL,
	`message` text NOT NULL,
	`type` enum('anomaly_alert','price_threshold','sync_update') NOT NULL,
	`link_url` varchar(255),
	`is_read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_forecasts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`commodity_id` int NOT NULL,
	`level` enum('konsumen','produsen') NOT NULL,
	`province_code` varchar(4),
	`forecast_month` char(7) NOT NULL,
	`predicted_price` int NOT NULL,
	`lower_bound` int NOT NULL,
	`upper_bound` int NOT NULL,
	`generated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_forecasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provinces` (
	`code` varchar(4) NOT NULL,
	`name` varchar(100) NOT NULL,
	`alt_name` varchar(100),
	`lat` double,
	`lng` double,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provinces_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `search_histories` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`commodity_id` int NOT NULL,
	`level` varchar(20),
	`province_code` varchar(4),
	`period_from` char(7),
	`period_to` char(7),
	`searched_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_histories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_watchlists` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`commodity_id` int NOT NULL,
	`level` enum('konsumen','produsen') NOT NULL,
	`province_code` varchar(4),
	`target_min_price` int,
	`target_max_price` int,
	`alert_on_anomaly` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_watchlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`username` varchar(64) NOT NULL,
	`email` varchar(120) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','petani','pedagang','pembeli') NOT NULL DEFAULT 'pembeli',
	`default_province_code` varchar(4),
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `articles` ADD CONSTRAINT `articles_commodity_id_commodities_id_fk` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_users_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commodity_anomalies` ADD CONSTRAINT `commodity_anomalies_commodity_id_commodities_id_fk` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commodity_prices` ADD CONSTRAINT `commodity_prices_commodity_id_commodities_id_fk` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commodity_prices` ADD CONSTRAINT `commodity_prices_province_code_provinces_code_fk` FOREIGN KEY (`province_code`) REFERENCES `provinces`(`code`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_forecasts` ADD CONSTRAINT `price_forecasts_commodity_id_commodities_id_fk` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `price_forecasts` ADD CONSTRAINT `price_forecasts_province_code_provinces_code_fk` FOREIGN KEY (`province_code`) REFERENCES `provinces`(`code`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_histories` ADD CONSTRAINT `search_histories_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_histories` ADD CONSTRAINT `search_histories_commodity_id_commodities_id_fk` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_histories` ADD CONSTRAINT `search_histories_province_code_provinces_code_fk` FOREIGN KEY (`province_code`) REFERENCES `provinces`(`code`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_watchlists` ADD CONSTRAINT `user_watchlists_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_watchlists` ADD CONSTRAINT `user_watchlists_commodity_id_commodities_id_fk` FOREIGN KEY (`commodity_id`) REFERENCES `commodities`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_watchlists` ADD CONSTRAINT `user_watchlists_province_code_provinces_code_fk` FOREIGN KEY (`province_code`) REFERENCES `provinces`(`code`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_default_province_code_provinces_code_fk` FOREIGN KEY (`default_province_code`) REFERENCES `provinces`(`code`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `search_price_idx` ON `commodity_prices` (`period_month`,`level`,`region_scope`);