import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  poolConnection: mysql.Pool | undefined;
};

const poolConnection =
  globalForDb.poolConnection ??
  mysql.createPool({
    uri: process.env.DATABASE_URL || "mysql://root:@localhost:3306/pantau_pangan_v2",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
      rejectUnauthorized: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.poolConnection = poolConnection;
}

export const db = drizzle(poolConnection, { schema, mode: "default" });
export * from "./schema";
