"use server";

import { getQuizQuestionsAndOptionsForUser } from "@/services/questions.service";

interface Note {
  id: string;
  title: string;
  content: string;
}

interface QuizData {
  notes: Note;
}

interface GroupedNote {
  note: Note;
  questionCount: number;
}

export async function fetchAvailableQuizzes(
  userId: string
): Promise<GroupedNote[]> {
  const quizData: QuizData[] = await getQuizQuestionsAndOptionsForUser(userId);

  const groupedByNote: Record<string, GroupedNote> = quizData.reduce(
    (acc, curr) => {
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
    },
    {} as Record<string, GroupedNote>
  );

  return Object.values(groupedByNote);
}
