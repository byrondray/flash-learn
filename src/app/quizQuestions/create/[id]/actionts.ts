"use server";

import { getNoteByIdForUser } from "@/services/note.service";
import {
  createQuizQuestion,
  getQuizQuestionsForNoteId,
} from "@/services/questions.service";
import { generateUniqueQuestions } from "@/utils/createAiQuestions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { noteIdSchema, saveQuizQuestionsSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateQuizQuestionsAction(
  noteId: string
): Promise<GeneratedQuestion[]> {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds}s`
    );
  }

  noStore();

  const note = await getNoteByIdForUser(parsed.data, user.id);
  if (!note) {
    throw new Error("Note not found");
  }

  const existingQuizQuestions = await getQuizQuestionsForNoteId(parsed.data);
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
  const parsed = saveQuizQuestionsSchema.safeParse({ noteId, questions });
  if (!parsed.success) throw new Error("Invalid input");

  const savedQuestions = await Promise.all(
    parsed.data.questions.map((question) =>
      createQuizQuestion(
        parsed.data.noteId,
        question.question,
        question.options,
        question.correctAnswer,
        question.explanation
      )
    )
  );
  return savedQuestions;
}
