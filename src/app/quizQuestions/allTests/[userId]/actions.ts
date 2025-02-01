"use server";

import { getQuizQuestionsAndOptionsForUser } from "@/services/questions.service";

export async function fetchAvailableQuizzes(userId: string) {
  const quizData = await getQuizQuestionsAndOptionsForUser(userId);

  const groupedByNote = quizData.reduce((acc: { [key: string]: any }, curr) => {
    const noteId = curr.notes.id;
    if (!acc[noteId]) {
      acc[noteId] = {
        note: {
          id: curr.notes.id,
          title: curr.notes.title,
          content: curr.notes.content,
        },
        questionCount: 0,
      };
    }
    acc[noteId].questionCount++;
    return acc;
  }, {});

  return Object.values(groupedByNote);
}
