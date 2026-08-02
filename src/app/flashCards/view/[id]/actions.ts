"use server";

import {
  getFlashCardsForNoteId,
  updateFlashCard,
  deleteFlashCard,
} from "@/services/cards.service";
import {
  getPublicNoteById,
  getNoteWithAccess,
  canAccessFlashcards,
  getOrCreateFlashcardShareToken,
} from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import {
  noteIdSchema,
  parseOptionalShareToken,
  updateFlashCardSchema,
  deleteFlashCardSchema,
} from "@/lib/validations";

export async function fetchFlashCardsAndNote(
  noteId: string,
  shareToken?: string
) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const parsedToken = parseOptionalShareToken(shareToken);

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const isOwnerOrCollaborator = await getNoteWithAccess(parsed.data, user.id);
  const hasAccess = await canAccessFlashcards(
    parsed.data,
    user.id,
    parsedToken,
    isOwnerOrCollaborator
  );
  if (!hasAccess) throw new Error("Note not found");

  // A share-token viewer (not the owner/a collaborator) only gets the note
  // title, never its content — the note body isn't part of what a
  // flashcard share link is meant to expose. `isOwnerOrCollaborator` already
  // holds the full row from `getNoteWithAccess` above, so the owner/
  // collaborator path reuses it instead of re-fetching the same note.
  const [publicNote, flashcards] = await Promise.all([
    isOwnerOrCollaborator ? null : getPublicNoteById(parsed.data),
    getFlashCardsForNoteId(parsed.data),
  ]);

  const note = isOwnerOrCollaborator
    ? { notes: isOwnerOrCollaborator.notes }
    : publicNote;

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

export async function editFlashCard(
  flashCardId: string,
  question: string,
  answer: string
) {
  const parsed = updateFlashCardSchema.safeParse({
    flashCardId,
    question,
    answer,
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const [updated] = await updateFlashCard(
    parsed.data.flashCardId,
    user.id,
    parsed.data.question,
    parsed.data.answer
  );
  if (!updated) throw new Error("Flashcard not found");

  return updated;
}

export async function removeFlashCard(flashCardId: string) {
  const parsed = deleteFlashCardSchema.safeParse({ flashCardId });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  await deleteFlashCard(parsed.data.flashCardId, user.id);
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
