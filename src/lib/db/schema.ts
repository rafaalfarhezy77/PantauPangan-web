import {
  mysqlTable,
  serial,
  bigint,
  int,
  varchar,
  char,
  double,
  boolean,
  timestamp,
  text,
  decimal,
  mysqlEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// 1. Provinces
export const provinces = mysqlTable("provinces", {
  code: varchar("code", { length: 4 }).primaryKey(), // e.g. "11", "35"
  name: varchar("name", { length: 100 }).notNull(),
  altName: varchar("alt_name", { length: 100 }),
  lat: double("lat"),
  lng: double("lng"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const provincesRelations = relations(provinces, ({ many }) => ({
  prices: many(commodityPrices),
  users: many(users),
  forecasts: many(priceForecasts),
  watchlists: many(userWatchlists),
  searchHistories: many(searchHistories),
}));

// 2. Commodities
export const commodities = mysqlTable("commodities", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  apiName: varchar("api_name", { length: 120 }).notNull().unique(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  category: mysqlEnum("category", [
    "pokok",
    "bumbu",
    "protein",
    "minyak_gula",
    "lainnya",
  ]).notNull(),
  unit: varchar("unit", { length: 20 }).default("per kg").notNull(),
  icon: varchar("icon", { length: 16 }),
  hasConsumerNational: boolean("has_consumer_national").default(false).notNull(),
  hasConsumerProv: boolean("has_consumer_prov").default(false).notNull(),
  hasProducerNational: boolean("has_producer_national").default(false).notNull(),
  hasProducerProv: boolean("has_producer_prov").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const commoditiesRelations = relations(commodities, ({ many }) => ({
  prices: many(commodityPrices),
  anomalies: many(commodityAnomalies),
  forecasts: many(priceForecasts),
  watchlists: many(userWatchlists),
  searchHistories: many(searchHistories),
  articles: many(articles),
}));

// 3. Commodity Prices
export const commodityPrices = mysqlTable(
  "commodity_prices",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    commodityId: int("commodity_id")
      .notNull()
      .references(() => commodities.id, { onDelete: "cascade" }),
    level: mysqlEnum("level", ["konsumen", "produsen"]).notNull(),
    regionScope: mysqlEnum("region_scope", ["nasional", "provinsi"]).notNull(),
    provinceCode: varchar("province_code", { length: 4 }).references(
      () => provinces.code,
      { onDelete: "set null" }
    ),
    periodMonth: char("period_month", { length: 7 }).notNull(), // 'YYYY-MM'
    price: int("price"),
    priceRaw: varchar("price_raw", { length: 32 }),
    momChangePct: decimal("mom_change_pct", { precision: 6, scale: 2 }),
    yoyChangePct: decimal("yoy_change_pct", { precision: 6, scale: 2 }),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_price_record_idx").on(
      table.commodityId,
      table.level,
      table.regionScope,
      table.provinceCode,
      table.periodMonth
    ),
    index("search_price_idx").on(
      table.periodMonth,
      table.level,
      table.regionScope
    ),
  ]
);

export const commodityPricesRelations = relations(commodityPrices, ({ one }) => ({
  commodity: one(commodities, {
    fields: [commodityPrices.commodityId],
    references: [commodities.id],
  }),
  province: one(provinces, {
    fields: [commodityPrices.provinceCode],
    references: [provinces.code],
  }),
}));

// 4. Commodity Anomalies
export const commodityAnomalies = mysqlTable(
  "commodity_anomalies",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    commodityId: int("commodity_id")
      .notNull()
      .references(() => commodities.id, { onDelete: "cascade" }),
    periodMonth: char("period_month", { length: 7 }).notNull(), // 'YYYY-MM'
    qipa: decimal("qipa", { precision: 8, scale: 3 }),
    aipa: decimal("aipa", { precision: 8, scale: 3 }),
    ifpa: decimal("ifpa", { precision: 8, scale: 3 }),
    status: varchar("status", { length: 40 }),
    severity: mysqlEnum("severity", [
      "normal",
      "warning",
      "alert_low",
      "alert_high",
    ])
      .notNull()
      .default("normal"),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_commodity_anomaly_idx").on(
      table.commodityId,
      table.periodMonth
    ),
  ]
);

export const commodityAnomaliesRelations = relations(commodityAnomalies, ({ one }) => ({
  commodity: one(commodities, {
    fields: [commodityAnomalies.commodityId],
    references: [commodities.id],
  }),
}));

// 5. API Sync Metadata
export const apiSyncMetadata = mysqlTable(
  "api_sync_metadata",
  {
    id: serial("id").primaryKey(),
    level: varchar("level", { length: 20 }).notNull(),
    regionScope: varchar("region_scope", { length: 20 }).notNull(),
    commodityCount: int("commodity_count").default(0),
    rowCount: int("row_count").default(0),
    periodFrom: char("period_from", { length: 7 }),
    periodTo: char("period_to", { length: 7 }),
    lastCheckedAt: timestamp("last_checked_at"),
    lastSyncedAt: timestamp("last_synced_at"),
    lastSyncStatus: varchar("last_sync_status", { length: 32 }),
    creditsEstimated: int("credits_estimated").default(0),
  },
  (table) => [
    uniqueIndex("unique_sync_scope_idx").on(table.level, table.regionScope),
  ]
);

// 6. Price Forecasts
export const priceForecasts = mysqlTable("price_forecasts", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  commodityId: int("commodity_id")
    .notNull()
    .references(() => commodities.id, { onDelete: "cascade" }),
  level: mysqlEnum("level", ["konsumen", "produsen"]).notNull(),
  provinceCode: varchar("province_code", { length: 4 }).references(
    () => provinces.code,
    { onDelete: "set null" }
  ),
  forecastMonth: char("forecast_month", { length: 7 }).notNull(),
  predictedPrice: int("predicted_price").notNull(),
  lowerBound: int("lower_bound").notNull(),
  upperBound: int("upper_bound").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const priceForecastsRelations = relations(priceForecasts, ({ one }) => ({
  commodity: one(commodities, {
    fields: [priceForecasts.commodityId],
    references: [commodities.id],
  }),
  province: one(provinces, {
    fields: [priceForecasts.provinceCode],
    references: [provinces.code],
  }),
}));

// 7. Users
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: varchar("name", { length: 100 }).notNull(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  email: varchar("email", { length: 120 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "petani", "pedagang", "pembeli"])
    .notNull()
    .default("pembeli"),
  defaultProvinceCode: varchar("default_province_code", { length: 4 }).references(
    () => provinces.code,
    { onDelete: "set null" }
  ),
  createdBy: varchar("created_by", { length: 36 }),
  updatedBy: varchar("updated_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  defaultProvince: one(provinces, {
    fields: [users.defaultProvinceCode],
    references: [provinces.code],
  }),
  watchlists: many(userWatchlists),
  searchHistories: many(searchHistories),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

// 8. User Watchlists
export const userWatchlists = mysqlTable("user_watchlists", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  commodityId: int("commodity_id")
    .notNull()
    .references(() => commodities.id, { onDelete: "cascade" }),
  level: mysqlEnum("level", ["konsumen", "produsen"]).notNull(),
  provinceCode: varchar("province_code", { length: 4 }).references(
    () => provinces.code,
    { onDelete: "set null" }
  ),
  targetMinPrice: int("target_min_price"),
  targetMaxPrice: int("target_max_price"),
  alertOnAnomaly: boolean("alert_on_anomaly").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userWatchlistsRelations = relations(userWatchlists, ({ one }) => ({
  user: one(users, {
    fields: [userWatchlists.userId],
    references: [users.id],
  }),
  commodity: one(commodities, {
    fields: [userWatchlists.commodityId],
    references: [commodities.id],
  }),
  province: one(provinces, {
    fields: [userWatchlists.provinceCode],
    references: [provinces.code],
  }),
}));

// 9. Search Histories
export const searchHistories = mysqlTable("search_histories", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  commodityId: int("commodity_id")
    .notNull()
    .references(() => commodities.id, { onDelete: "cascade" }),
  level: varchar("level", { length: 20 }),
  provinceCode: varchar("province_code", { length: 4 }).references(
    () => provinces.code,
    { onDelete: "set null" }
  ),
  periodFrom: char("period_from", { length: 7 }),
  periodTo: char("period_to", { length: 7 }),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

export const searchHistoriesRelations = relations(searchHistories, ({ one }) => ({
  user: one(users, {
    fields: [searchHistories.userId],
    references: [users.id],
  }),
  commodity: one(commodities, {
    fields: [searchHistories.commodityId],
    references: [commodities.id],
  }),
  province: one(provinces, {
    fields: [searchHistories.provinceCode],
    references: [provinces.code],
  }),
}));

// 10. Notifications
export const notifications = mysqlTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 160 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", [
    "anomaly_alert",
    "price_threshold",
    "sync_update",
  ]).notNull(),
  linkUrl: varchar("link_url", { length: 255 }),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// 11. Articles & Audit Logs
export const articles = mysqlTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  sourceName: varchar("source_name", { length: 100 }).notNull(),
  content: text("content").notNull(),
  commodityId: int("commodity_id").references(() => commodities.id, {
    onDelete: "set null",
  }),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

export const articlesRelations = relations(articles, ({ one }) => ({
  commodity: one(commodities, {
    fields: [articles.commodityId],
    references: [commodities.id],
  }),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  actorId: varchar("actor_id", { length: 36 }).references(() => users.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 64 }).notNull(),
  targetType: varchar("target_type", { length: 64 }).notNull(),
  targetId: varchar("target_id", { length: 64 }),
  metadataJson: text("metadata_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));
