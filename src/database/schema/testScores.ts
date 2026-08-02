import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { quizQuestions } from "./quizQuestions";
import { users } from "./users";

export const testScores = sqliteTable(
  "testScores",
  {
    id: text("id").primaryKey().notNull(),
    quizQuestionId: text("quizQuestionId")
      .notNull()
      .references(() => quizQuestions.id, {
        onDelete: "cascade",
      }),
    // Who actually took the test — previously inferred (incorrectly) by
    // joining back to the note's owner, which meant a shared-quiz taker's
    // score was attributed to the note owner instead of themselves.
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: text("score").notNull(),
    dateAttempted: text("dateAttempted").notNull(),
  },
  (table) => ({
    quizQuestionIdx: index("idx_testScores_quizQuestionId").on(
      table.quizQuestionId
    ),
    userIdx: index("idx_testScores_userId").on(table.userId),
  })
);

export type TestScores = typeof testScores.$inferSelect;
export type TestScoresInsert = typeof testScores.$inferInsert;
