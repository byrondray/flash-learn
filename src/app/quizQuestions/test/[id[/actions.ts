"use server";

import { getQuizQuestionsForNoteId } from "@/services/questions.service";
import { createTestScore } from "@/services/testScores.service";

export async function fetchQuizQuestions(noteId: string) {
  return await getQuizQuestionsForNoteId(noteId);
}

export async function saveTestScore(quizQuestionId: string, score: number) {
  return await createTestScore(
    quizQuestionId,
    score.toString(),
    new Date().toISOString()
  );
}
