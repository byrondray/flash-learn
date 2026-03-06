"use server";

import { getNoteByIdForUser } from "@/services/note.service";
import {
  createQuizQuestion,
  getQuizQuestionsForNoteId,
} from "@/services/questions.service";
import { generateUniqueQuestions } from "@/utils/createAiQuestions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateQuizQuestionsAction(
  noteId: string
): Promise<GeneratedQuestion[]> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  noStore();

  const note = await getNoteByIdForUser(noteId, user.id);
  if (!note) {
    throw new Error("Note not found");
  }

  const existingQuizQuestions = await getQuizQuestionsForNoteId(noteId);
  return await generateUniqueQuestions(
    note.notes.title,
    note.notes.content,
    existingQuizQuestions
  );
}

export async function saveQuizQuestions(
  noteId: string,
  questions: GeneratedQuestion[]
) {
  const savedQuestions = await Promise.all(
    questions.map((question) =>
      createQuizQuestion(
        noteId,
        question.question,
        question.options,
        question.correctAnswer,
        question.explanation
      )
    )
  );
  return savedQuestions;
}
