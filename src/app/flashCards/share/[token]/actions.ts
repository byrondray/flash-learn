"use server";

import { getNoteByFlashcardShareToken } from "@/services/note.service";

export async function resolveFlashcardShareToken(token: string) {
  const note = await getNoteByFlashcardShareToken(token);
  if (!note) return { success: false as const, error: "Invalid share link" };
  return { success: true as const, noteId: note.notes.id };
}
