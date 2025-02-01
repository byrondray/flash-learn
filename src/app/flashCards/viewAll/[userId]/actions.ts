"use server";

import { getFlashCardsForUser } from "@/services/cards.service";

export async function fetchUserFlashcards(userId: string) {
  const flashcards = await getFlashCardsForUser(userId);

  const groupedByNote = flashcards.reduce((acc: { [key: string]: any }, curr) => {
    const noteId = curr.flashCards.noteId;
    if (!acc[noteId]) {
      acc[noteId] = {
        noteId: curr.flashCards.noteId,
        title: curr.notes.title,
        content: curr.notes.content,
        flashcardCount: 0,
      };
    }
    acc[noteId].flashcardCount++;
    return acc;
  }, {});

  return Object.values(groupedByNote);
}
