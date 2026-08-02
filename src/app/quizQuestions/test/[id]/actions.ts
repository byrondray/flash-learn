"use server";

import {
  getQuizQuestionsForNoteId,
  getQuizQuestionById,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "@/services/questions.service";
import { createTestScore } from "@/services/testScores.service";
import {
  canAccessQuiz,
  getNoteWithAccess,
  getOrCreateQuizShareToken,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  noteIdSchema,
  saveTestScoreSchema,
  parseOptionalShareToken,
  updateQuizQuestionSchema,
  deleteQuizQuestionSchema,
} from "@/lib/validations";

export async function fetchQuizQuestions(noteId: string, shareToken?: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const parsedToken = parseOptionalShareToken(shareToken);

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const hasAccess = await canAccessQuiz(parsed.data, user.id, parsedToken);
  if (!hasAccess) throw new Error("Access denied");

  return await getQuizQuestionsForNoteId(parsed.data);
}

export async function saveTestScore(
  quizQuestionId: string,
  score: number,
  shareToken?: string
) {
  const parsed = saveTestScoreSchema.safeParse({ quizQuestionId, score });
  if (!parsed.success) throw new Error("Invalid input");

  const parsedToken = parseOptionalShareToken(shareToken);

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const quizQuestion = await getQuizQuestionById(parsed.data.quizQuestionId);
  if (!quizQuestion) throw new Error("Quiz question not found");

  const hasAccess = await canAccessQuiz(
    quizQuestion.noteId,
    user.id,
    parsedToken
  );
  if (!hasAccess) throw new Error("Access denied");

  return await createTestScore(
    parsed.data.quizQuestionId,
    user.id,
    parsed.data.score.toString(),
    new Date().toISOString()
  );
}

export async function getQuizShareLink(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const token = await getOrCreateQuizShareToken(parsed.data, user.id);
  if (!token) throw new Error("Only the note owner can share quizzes");

  return token;
}

export async function editQuizQuestion(
  quizQuestionId: string,
  question: string,
  options: string[],
  correctAnswer: string,
  explanation: string
) {
  const parsed = updateQuizQuestionSchema.safeParse({
    quizQuestionId,
    question,
    options,
    correctAnswer,
    explanation,
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const updated = await updateQuizQuestion(
    parsed.data.quizQuestionId,
    user.id,
    parsed.data.question,
    parsed.data.options,
    parsed.data.correctAnswer,
    parsed.data.explanation
  );
  if (!updated) throw new Error("Quiz question not found");

  return updated;
}

export async function removeQuizQuestion(quizQuestionId: string) {
  const parsed = deleteQuizQuestionSchema.safeParse({ quizQuestionId });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  await deleteQuizQuestion(parsed.data.quizQuestionId, user.id);
}

export async function checkIsNoteOwner(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) return false;

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return false;

  const access = await getNoteWithAccess(parsed.data, user.id);
  return access?.role === "owner";
}
