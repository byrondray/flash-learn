import * as libsql from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// Both env vars are strings, so `IS_DEV=false`/`dbLogging=false` are
// non-empty and therefore truthy — casting them straight to boolean picked
// the wrong DB URL / turned on query logging (leaking note content into
// production logs) whenever someone set the var to the literal "false"
// instead of unsetting it. Compare against the string explicitly.
const isDev = process.env.IS_DEV === "true";
const logging = process.env.dbLogging === "true";

const url = isDev ? process.env.LOCAL_DB_URL : process.env.DB_URL;

if (!url) throw new Error("Missing db url env variable");

const authToken = process.env.AUTH_TOKEN;
if (!authToken && !isDev) throw new Error("Missing db auth token env variable");

const client = createClient({ url, authToken });

let dbSingleton: libsql.LibSQLDatabase | undefined;

export const getDB = () => {
  return (dbSingleton ??= libsql.drizzle(client, {
    logger: logging,
  }));
};
