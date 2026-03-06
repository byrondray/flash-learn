import { getDB } from "@/database/client";
import { quizQuestions } from "@/database/schema/quizQuestions";
import { questionOptions } from "@/database/schema/quizQuestionOptions";
import { v4 as uuid } from "uuid";
import { eq, and, inArray } from "drizzle-orm";
import { notes } from "@/database/schema/notes";

const db = getDB();

export async function createQuizQuestion(
  noteId: string,
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string
) {
  return await db.transaction(async (tx) => {
    const [createdQuestion] = await tx
      .insert(quizQuestions)
      .values({
        id: uuid(),
        noteId,
        question,
        correctAnswer,
        explanation,
      })
      .returning();

    const optionsToInsert = options.map((optionText) => ({
      id: uuid(),
      questionId: createdQuestion.id,
      optionText,
    }));

    await tx.insert(questionOptions).values(optionsToInsert);

    return createdQuestion;
  });
}

export async function updateQuizQuestion(
  quizQuestionId: string,
  userId: string,
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string
) {
  const owned = await db
    .select()
    .from(quizQuestions)
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .where(and(eq(quizQuestions.id, quizQuestionId), eq(notes.userId, userId)));

  if (owned.length === 0) return null;

  return await db.transaction(async (tx) => {
    const [updatedQuestion] = await tx
      .update(quizQuestions)
      .set({ question, correctAnswer, explanation })
      .where(eq(quizQuestions.id, quizQuestionId))
      .returning();

    await tx
      .delete(questionOptions)
      .where(eq(questionOptions.questionId, quizQuestionId));

    const optionsToInsert = options.map((optionText) => ({
      id: uuid(),
      questionId: quizQuestionId,
      optionText,
    }));

    await tx.insert(questionOptions).values(optionsToInsert);

    return updatedQuestion;
  });
}

export async function deleteQuizQuestion(
  quizQuestionId: string,
  userId: string
) {
  const owned = await db
    .select()
    .from(quizQuestions)
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .where(and(eq(quizQuestions.id, quizQuestionId), eq(notes.userId, userId)));

  if (owned.length === 0) return;

  return await db
    .delete(quizQuestions)
    .where(eq(quizQuestions.id, quizQuestionId));
}

export async function getQuizQuestionsForNoteId(noteId: string) {
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.noteId, noteId));

  if (questions.length === 0) return [];

  const questionIds = questions.map((q) => q.id);
  const options = await db
    .select()
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds));

  return questions.map((question) => ({
    ...question,
    options: options.filter((opt) => opt.questionId === question.id),
  }));
}

export async function getQuizQuestionsAndOptionsForUser(userId: string) {
  const questions = await db
    .select()
    .from(quizQuestions)
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .where(eq(notes.userId, userId));

  if (questions.length === 0) return [];

  const questionIds = questions.map((q) => q.quizQuestions.id);
  const options = await db
    .select()
    .from(questionOptions)
    .where(inArray(questionOptions.questionId, questionIds));

  return questions.map((question) => ({
    ...question,
    options: options.filter(
      (opt) => opt.questionId === question.quizQuestions.id
    ),
  }));
}
