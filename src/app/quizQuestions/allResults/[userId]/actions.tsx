"use server";

import { getNoteById } from "@/services/note.service";
import { getTestScoresForUser } from "@/services/testScores.service";

interface ProcessedTestScore {
  testScores: {
    id: string;
    score: string;
    dateAttempted: string;
  };
  notes: {
    id: string;
    title: string;
  };
}

export async function fetchUserTestScores(userId: string) {
  const scores = await getTestScoresForUser(userId);

  const processedScores: ProcessedTestScore[] = [];

  for (const score of scores) {
    try {
      const note = await getNoteById(score.notes.id);

      if (note) {
        processedScores.push({
          testScores: {
            id: score.testScores.id,
            score: score.testScores.score,
            dateAttempted: score.testScores.dateAttempted,
          },
          notes: {
            id: note.notes.id,
            title: note.notes.title,
          },
        });
      }
    } catch (error) {
      console.error("Error processing score:", error);
    }
  }

  return processedScores.sort((a, b) => {
    const dateA = new Date(a.testScores.dateAttempted).getTime();
    const dateB = new Date(b.testScores.dateAttempted).getTime();
    return isNaN(dateB) || isNaN(dateA) ? 0 : dateB - dateA;
  });
}
