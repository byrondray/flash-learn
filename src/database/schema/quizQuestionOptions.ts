import { sqliteTable } from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";
import { quizQuestions } from "./quizQuestions";

export const questionOptions = sqliteTable("questionOptions", {
  id: text("id").primaryKey().notNull(),
  questionId: text("questionId")
    .notNull()
    .references(() => quizQuestions.id, { onDelete: "cascade" }),
  optionText: text("optionText").notNull(),
});
