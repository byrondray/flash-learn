"use server";

import { getFlashCardsForNoteId } from "@/services/cards.service";
import {
  getNoteById,
  getPublicNoteById,
  getNoteWithAccess,
  canAccessFlashcards,
  getOrCreateFlashcardShareToken,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { noteIdSchema, shareTokenSchema } from "@/lib/validations";

export async function fetchFlashCardsAndNote(
  noteId: string,
  shareToken?: string
) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const parsedToken = shareToken
    ? shareTokenSchema.safeParse(shareToken)
    : undefined;
  if (shareToken && !parsedToken?.success) throw new Error("Invalid share link");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isOwnerOrCollaborator = await getNoteWithAccess(parsed.data, user.id);
  const hasAccess = await canAccessFlashcards(
    parsed.data,
    user.id,
    parsedToken?.data
  );
  if (!hasAccess) throw new Error("Note not found");

  // A share-token viewer (not the owner/a collaborator) only gets the note
  // title, never its content — the note body isn't part of what a
  // flashcard share link is meant to expose.
  const [note, flashcards] = await Promise.all([
    isOwnerOrCollaborator ? getNoteById(parsed.data) : getPublicNoteById(parsed.data),
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
