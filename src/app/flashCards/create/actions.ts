"use server";

import { getNoteById } from "@/services/note.service";
import { generateFlashcards } from "@/utils/createAiQuestions";

export async function generateFlashcardsAction(noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new Error("Note not found");
  }

  return await generateFlashcards(note.notes.title, note.notes.content);
}
