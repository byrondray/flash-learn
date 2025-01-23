import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { quizQuestions, QuizQuestions } from "@/database/schema/quizQuestions";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

const db = getDB();

export async function createQuizQuestion(
  noteId: string,
  question: string,
  answer: string
) {
  return await db
    .insert(quizQuestions)
    .values({ id: uuid(), noteId, question, answer })
    .returning();
}

export async function updateQuizQuestion(
  quizQuestionId: string,
  question: string,
  answer: string
) {
  return await db
    .update(quizQuestions)
    .set({ question, answer })
    .where(eq(quizQuestions.id, quizQuestionId))
    .returning();
}

export async function deleteQuizQuestion(quizQuestionId: string) {
  return await db
    .delete(quizQuestions)
    .where(eq(quizQuestions.id, quizQuestionId));
}

export async function getQuizQuestionsForNoteId(noteId: string) {
  return await db
    .select({ quizQuestions })
    .from(quizQuestions)
    .where(eq(quizQuestions.noteId, noteId));
}
