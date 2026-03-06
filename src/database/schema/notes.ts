import { sqliteTable, text, blob } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey().notNull(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  lastUpdated: text("lastUpdated").default(sql`(current_timestamp)`),
  yjsState: blob("yjsState"),
});

export type Notes = typeof notes.$inferSelect;
export type NotesInsert = typeof notes.$inferInsert;
