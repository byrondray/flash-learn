"use server";

import { getFlashCardsForNoteId } from "@/services/cards.service";
import { getNoteById } from "@/services/note.service";

export async function fetchFlashCardsAndNote(noteId: string) {
  const [note, flashcards] = await Promise.all([
    getNoteById(noteId),
    getFlashCardsForNoteId(noteId),
  ]);

  return {
    note,
    flashcards,
  };
}
