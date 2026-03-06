"use server";

import {
  updateNote,
  updateNoteTitle,
  getNoteByIdForUser,
  deleteNote,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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

export async function updateExistingNoteTitle(noteId: string, title: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await updateNoteTitle(noteId, user.id, title);
}

export async function deleteExistingNote(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await deleteNote(noteId, user.id);
}

export async function fetchNote(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await getNoteByIdForUser(noteId, user.id);
}
