"use server";

import { getFlashCardsForNoteId } from "@/services/cards.service";
import { getNoteByIdForUser } from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function fetchFlashCardsAndNote(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const [note, flashcards] = await Promise.all([
    getNoteByIdForUser(noteId, user.id),
    getFlashCardsForNoteId(noteId),
  ]);

  if (!note) throw new Error("Note not found");

  return {
    note,
    flashcards,
  };
}
