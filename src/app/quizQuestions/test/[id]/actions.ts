"use server";

import {
  getQuizQuestionsForNoteId,
  getQuizQuestionById,
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
  shareTokenSchema,
} from "@/lib/validations";

export async function fetchQuizQuestions(noteId: string, shareToken?: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const parsedToken = shareToken
    ? shareTokenSchema.safeParse(shareToken)
    : undefined;
  if (shareToken && !parsedToken?.success) throw new Error("Invalid share link");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const hasAccess = await canAccessQuiz(parsed.data, user.id, parsedToken?.data);
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

  const parsedToken = shareToken
    ? shareTokenSchema.safeParse(shareToken)
    : undefined;
  if (shareToken && !parsedToken?.success) throw new Error("Invalid share link");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const quizQuestion = await getQuizQuestionById(parsed.data.quizQuestionId);
  if (!quizQuestion) throw new Error("Quiz question not found");

  const hasAccess = await canAccessQuiz(
    quizQuestion.noteId,
    user.id,
    parsedToken?.data
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

export async function checkIsNoteOwner(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) return false;

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return false;

  const access = await getNoteWithAccess(parsed.data, user.id);
  return access?.role === "owner";
}
