import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { notes } from "./notes";

export const flashCards = sqliteTable("flashCards", {
  id: text("id").primaryKey().notNull(),
  noteId: text("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
});

export type FlashCards = typeof flashCards.$inferSelect;
export type FlashCardsInsert = typeof flashCards.$inferInsert;
