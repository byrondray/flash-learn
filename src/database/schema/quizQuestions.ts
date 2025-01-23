import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { notes } from "./notes";

export const quizQuestions = sqliteTable("quizQuestions", {
  id: text("id").primaryKey().notNull(),
  noteId: text("noteId")
    .notNull()
    .references(() => notes.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
});

export type QuizQuestions = typeof quizQuestions.$inferSelect;
export type QuizQuestionsInsert = typeof quizQuestions.$inferInsert;
