import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { testScores } from "@/database/schema/testScores";
import { users } from "@/database/schema/users";
import { v4 as uuid } from "uuid";
import { eq, and, desc } from "drizzle-orm";
import { quizQuestions } from "@/database/schema/quizQuestions";

const noteColumns = {
  id: notes.id,
  userId: notes.userId,
  title: notes.title,
  content: notes.content,
  lastUpdated: notes.lastUpdated,
  inviteToken: notes.inviteToken,
};

const db = getDB();

export async function createTestScore(
  quizQuestionId: string,
  userId: string,
  score: string,
  dateAttempted: string
) {
  return await db
    .insert(testScores)
    .values({ id: uuid(), quizQuestionId, userId, score, dateAttempted })
    .returning();
}

// Scoped to the test-taker (testScores.userId), not the note owner — a
// score belongs to whoever took the quiz, and only they should be able to
// edit or delete it.
export async function updateTestScore(
  testScoreId: string,
  userId: string,
  score: string,
  dateAttempted: string
) {
  return await db
    .update(testScores)
    .set({ score, dateAttempted })
    .where(and(eq(testScores.id, testScoreId), eq(testScores.userId, userId)))
    .returning();
}

export const deleteTestScore = async (testScoreId: string, userId: string) => {
  return await db
    .delete(testScores)
    .where(and(eq(testScores.id, testScoreId), eq(testScores.userId, userId)));
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

// Filtered by the test-taker's own userId (who actually sat the quiz), not
// by the note owner's — a shared-quiz score belongs to whoever took it.
export const getTestScoresForUser = async (userId: string) => {
  return await db
    .select({ testScores, notes: noteColumns })
    .from(testScores)
    .innerJoin(quizQuestions, eq(testScores.quizQuestionId, quizQuestions.id))
    .innerJoin(notes, eq(quizQuestions.noteId, notes.id))
    .where(eq(testScores.userId, userId));
};

export const getMostRecentTestScoreForUser = async (userId: string) => {
  return await db
    .select({ testScores })
    .from(testScores)
    .where(eq(testScores.userId, userId))
    .orderBy(desc(testScores.dateAttempted))
    .limit(1);
};
