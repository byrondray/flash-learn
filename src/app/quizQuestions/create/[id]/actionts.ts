"use server";

import { getNoteById } from "@/services/note.service";
import { getQuizQuestionsForNoteId } from "@/services/questions.service";
import { generateUniqueQuestions } from "@/utils/createAiQuestions";

export async function generateQuizQuestionsAction(noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new Error("Note not found");
  }

  const existingQuizQuestions = await getQuizQuestionsForNoteId(noteId);

  const quizQuestions = existingQuizQuestions.map((q) => q.quizQuestions);
  return await generateUniqueQuestions(
    note.notes.title,
    note.notes.content,
    quizQuestions
  );
}
