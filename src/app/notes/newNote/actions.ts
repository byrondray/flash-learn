"use server";

import {
  createNote,
  updateNote,
  getNoteByIdForUser,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  saveNoteSchema,
  updateNoteSchema,
  noteIdSchema,
} from "@/lib/validations";

export async function saveNote(title: string, content: string) {
  const parsed = saveNoteSchema.safeParse({ title, content });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await createNote(user.id, parsed.data.title, parsed.data.content);
}

export async function updateExistingNote(
  noteId: string,
  title: string,
  content: string
) {
  const parsed = updateNoteSchema.safeParse({ noteId, title, content });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await updateNote(
    parsed.data.noteId,
    user.id,
    parsed.data.title,
    parsed.data.content
  );
}

export async function fetchNote(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await getNoteByIdForUser(parsed.data, user.id);
}
