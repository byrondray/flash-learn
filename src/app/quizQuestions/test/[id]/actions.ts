"use server";

import { getQuizQuestionsForNoteId } from "@/services/questions.service";
import { createTestScore } from "@/services/testScores.service";
import {
  canAccessQuiz,
  getNoteWithAccess,
  getOrCreateQuizShareToken,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function fetchQuizQuestions(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const hasAccess = await canAccessQuiz(noteId, user.id);
  if (!hasAccess) throw new Error("Access denied");

  return await getQuizQuestionsForNoteId(noteId);
}

export async function saveTestScore(quizQuestionId: string, score: number) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  return await createTestScore(
    quizQuestionId,
    score.toString(),
    new Date().toISOString()
  );
}

export async function getQuizShareLink(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const token = await getOrCreateQuizShareToken(noteId, user.id);
  if (!token) throw new Error("Only the note owner can share quizzes");

  return token;
}

export async function checkIsNoteOwner(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return false;

  const access = await getNoteWithAccess(noteId, user.id);
  return access?.role === "owner";
}
