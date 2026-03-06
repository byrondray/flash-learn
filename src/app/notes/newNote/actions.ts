"use server";

import {
  createNote,
  updateNote,
  getNoteByIdForUser,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function saveNote(title: string, content: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await createNote(user.id, title, content);
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
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await getNoteByIdForUser(noteId, user.id);
}
