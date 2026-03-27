import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { normalizePostgresConnectionString } from "./lib/database-url";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: normalizePostgresConnectionString(env("DATABASE_URL")),
  },
});
