"use server";

import { updateNote, getNoteById } from "@/services/note.service";

export async function updateExistingNote(
  noteId: string,
  title: string,
  content: string
) {
  console.log("Server action: Updating note", { noteId, title, content });
  return await updateNote(noteId, title, content);
}

export async function fetchNote(noteId: string) {
  console.log("Server action: Fetching note", { noteId });
  return await getNoteById(noteId);
}
