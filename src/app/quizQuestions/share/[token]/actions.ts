"use server";

import { getNoteByQuizShareToken } from "@/services/note.service";

export async function resolveQuizShareToken(token: string) {
  const note = await getNoteByQuizShareToken(token);
  if (!note) return { success: false as const, error: "Invalid share link" };
  return { success: true as const, noteId: note.notes.id };
}
