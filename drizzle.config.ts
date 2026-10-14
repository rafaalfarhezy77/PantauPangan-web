import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "mysql://user:pass@gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com:4000/pantau_pangan_v2",
  },
});
