"use server";

import { createNote, updateNote, getNoteById } from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function saveNote(userId: string, title: string, content: string) {
  return await createNote(userId, title, content);
}

export async function updateExistingNote(
  noteId: string,
  title: string,
  content: string
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await updateNote(noteId, user.id, title, content);
}

export async function fetchNote(noteId: string) {
  return await getNoteById(noteId);
}
