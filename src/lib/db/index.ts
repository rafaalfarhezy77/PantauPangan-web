import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  poolConnection: mysql.Pool | undefined;
};

const isProduction = process.env.NODE_ENV === "production";
const dbUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/pantau_pangan_v2";
const useSsl = dbUrl.includes("tidb") || dbUrl.includes("ssl");

// Reset existing pool to clear stale SSL settings
if (globalForDb.poolConnection) {
  try {
    globalForDb.poolConnection.end().catch(() => {});
  } catch {}
  globalForDb.poolConnection = undefined;
}

const poolConnection = mysql.createPool({
  uri: dbUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

if (!isProduction) {
  globalForDb.poolConnection = poolConnection;
}

export const db = drizzle(poolConnection, { schema, mode: "default" });
export { poolConnection };
export * from "./schema";
