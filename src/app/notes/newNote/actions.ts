"use server";

import { createNote, updateNote } from "@/services/note.service";

export async function saveNote(userId: string, title: string, content: string) {
  return await createNote(userId, title, content);
}

export async function updateExistingNote(
  noteId: string,
  title: string,
  content: string
) {
  return await updateNote(noteId, title, content);
}
