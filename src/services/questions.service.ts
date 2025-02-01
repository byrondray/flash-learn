import { getDB } from "@/database/client";
import { quizQuestions } from "@/database/schema/quizQuestions";
import { questionOptions } from "@/database/schema/quizQuestionOptions";
import { v4 as uuid } from "uuid";
import { eq, inArray } from "drizzle-orm";

const db = getDB();

export async function createQuizQuestion(
  noteId: string,
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string
) {
  const [createdQuestion] = await db
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

  await db.insert(questionOptions).values(optionsToInsert);

  return createdQuestion;
}

export async function updateQuizQuestion(
  quizQuestionId: string,
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string
) {
  const [updatedQuestion] = await db
    .update(quizQuestions)
    .set({ question, correctAnswer, explanation })
    .where(eq(quizQuestions.id, quizQuestionId))
    .returning();

  await db
    .delete(questionOptions)
    .where(eq(questionOptions.questionId, quizQuestionId));

  const optionsToInsert = options.map((optionText) => ({
    id: uuid(),
    questionId: quizQuestionId,
    optionText,
  }));

  await db.insert(questionOptions).values(optionsToInsert);

  return updatedQuestion;
}

export async function deleteQuizQuestion(quizQuestionId: string) {
  return await db
    .delete(quizQuestions)
    .where(eq(quizQuestions.id, quizQuestionId));
}

export async function getQuizQuestionsForNoteId(noteId: string) {
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.noteId, noteId));

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
