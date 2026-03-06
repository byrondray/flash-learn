import type { Config } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

const isDev = process.env.IS_DEV;
const url = isDev ? process.env.LOCAL_DB_URL : process.env.DB_URL;
const authToken = process.env.AUTH_TOKEN;

if (!url) throw new Error("Missing db url env variable");

export default {
  dialect: "turso",
  schema: "./src/database/schema/*",
  out: "./drizzle",
  dbCredentials: { url, authToken },
} satisfies Config;
