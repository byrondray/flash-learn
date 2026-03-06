"use server";

import { getTestScoresForUser } from "@/services/testScores.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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

export async function fetchUserTestScores() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const scores = await getTestScoresForUser(user.id);

  const processedScores: ProcessedTestScore[] = scores.map((score) => ({
    testScores: {
      id: score.testScores.id,
      score: score.testScores.score,
      dateAttempted: score.testScores.dateAttempted,
    },
    notes: {
      id: score.notes.id,
      title: score.notes.title,
    },
  }));

  return processedScores.sort((a, b) => {
    const dateA = new Date(a.testScores.dateAttempted).getTime();
    const dateB = new Date(b.testScores.dateAttempted).getTime();
    return isNaN(dateB) || isNaN(dateA) ? 0 : dateB - dateA;
  });
}
