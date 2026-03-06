"use server";

import { getQuizQuestionsAndOptionsForUser } from "@/services/questions.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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

export async function fetchAvailableQuizzes(): Promise<GroupedNote[]> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  const quizData: QuizData[] = await getQuizQuestionsAndOptionsForUser(user.id);

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
