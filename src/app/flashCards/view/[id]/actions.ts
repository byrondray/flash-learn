"use server";

import { getFlashCardsForNoteId } from "@/services/cards.service";
import {
  getNoteById,
  getNoteWithAccess,
  canAccessFlashcards,
  getOrCreateFlashcardShareToken,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { noteIdSchema } from "@/lib/validations";

export async function fetchFlashCardsAndNote(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const hasAccess = await canAccessFlashcards(parsed.data, user.id);
  if (!hasAccess) throw new Error("Note not found");

  const [note, flashcards] = await Promise.all([
    getNoteById(parsed.data),
    getFlashCardsForNoteId(parsed.data),
  ]);

  if (!note) throw new Error("Note not found");

  return {
    note,
    flashcards,
  };
}

export async function getFlashcardShareLink(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const token = await getOrCreateFlashcardShareToken(parsed.data, user.id);
  if (!token) throw new Error("Only the note owner can share flashcards");

  return token;
}

export async function checkIsNoteOwner(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) return false;

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return false;

  const access = await getNoteWithAccess(parsed.data, user.id);
  return access?.role === "owner";
}
