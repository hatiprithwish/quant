import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/tables.ts",
  out: "./src/db/migrations",
  dialect: "sqlite",
} satisfies Config;
