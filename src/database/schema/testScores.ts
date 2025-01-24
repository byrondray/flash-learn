import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { quizQuestions } from "./quizQuestions";

export const testScores = sqliteTable("testScores", {
  id: text("id").primaryKey().notNull(),
  quizQuestionId: text("quizQuestionId").references(() => quizQuestions.id, {
    onDelete: "cascade",
  }),
  score: text("score").notNull(),
  dateAttempted: text("dateAttempted").notNull(),
});

export type TestScores = typeof testScores.$inferSelect;
export type TestScoresInsert = typeof testScores.$inferInsert;
