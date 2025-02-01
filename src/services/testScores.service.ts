import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { testScores } from "@/database/schema/testScores";
import { users } from "@/database/schema/users";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
import { quizQuestions } from "@/database/schema/quizQuestions";

const db = getDB();

export async function createTestScore(
  quizQuestionId: string,
  score: string,
  dateAttempted: string
) {
  return await db
    .insert(testScores)
    .values({ id: uuid(), quizQuestionId, score, dateAttempted })
    .returning();
}

export async function updateTestScore(
  testScoreId: string,
  score: string,
  dateAttempted: string
) {
  return await db
    .update(testScores)
    .set({ score, dateAttempted })
    .where(eq(testScores.id, testScoreId))
    .returning();
}

export const deleteTestScore = async (testScoreId: string) => {
  return await db.delete(testScores).where(eq(testScores.id, testScoreId));
};

export const getTestScoresForQuizQuestionId = async (
  quizQuestionId: string
) => {
  return await db
    .select({ testScores })
    .from(testScores)
    .where(eq(testScores.quizQuestionId, quizQuestionId));
};

export const getTestScoresForDate = async (date: string) => {
  return await db
    .select({ testScores })
    .from(testScores)
    .innerJoin(quizQuestions, eq(testScores.quizQuestionId, quizQuestions.id))
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .innerJoin(users, eq(notes.userId, users.id))
    .where(eq(testScores.dateAttempted, date));
};

export const getTestScoresForUser = async (userId: string) => {
  return await db
    .select({ testScores })
    .from(testScores)
    .innerJoin(quizQuestions, eq(testScores.quizQuestionId, quizQuestions.id))
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .innerJoin(users, eq(notes.userId, users.id))
    .where(eq(users.id, userId));
};

export const getMostRecentTestScoreForUser = async (userId: string) => {
  const scores = await db
    .select({ testScores })
    .from(testScores)
    .innerJoin(quizQuestions, eq(testScores.quizQuestionId, quizQuestions.id))
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .innerJoin(users, eq(notes.userId, users.id))
    .where(eq(users.id, userId));

  const sortedScores = scores.sort((a, b) => {
    const dateA = new Date(a.testScores.dateAttempted);
    const dateB = new Date(b.testScores.dateAttempted);
    return dateB.getTime() - dateA.getTime();
  });

  return sortedScores.length > 0 ? [sortedScores[0]] : [];
};
