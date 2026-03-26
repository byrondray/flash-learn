"use server";

import { getNoteByQuizShareToken } from "@/services/note.service";
import { shareTokenSchema } from "@/lib/validations";

export async function resolveQuizShareToken(token: string) {
  const parsed = shareTokenSchema.safeParse(token);
  if (!parsed.success)
    return { success: false as const, error: "Invalid share link" };

  const note = await getNoteByQuizShareToken(parsed.data);
  if (!note) return { success: false as const, error: "Invalid share link" };
  return { success: true as const, noteId: note.notes.id };
}
