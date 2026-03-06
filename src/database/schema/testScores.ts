import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { quizQuestions } from "./quizQuestions";

export const testScores = sqliteTable(
  "testScores",
  {
    id: text("id").primaryKey().notNull(),
    quizQuestionId: text("quizQuestionId")
      .notNull()
      .references(() => quizQuestions.id, {
        onDelete: "cascade",
      }),
    score: text("score").notNull(),
    dateAttempted: text("dateAttempted").notNull(),
  },
  (table) => ({
    quizQuestionIdx: index("idx_testScores_quizQuestionId").on(
      table.quizQuestionId
    ),
  })
);

export type TestScores = typeof testScores.$inferSelect;
export type TestScoresInsert = typeof testScores.$inferInsert;
