"use server";

import { getFlashCardsForUser } from "@/services/cards.service";

interface FlashCard {
  noteId: string;
}

interface Note {
  title: string;
  content: string;
}

interface FlashCardData {
  flashCards: FlashCard;
  notes: Note;
}

interface GroupedNote {
  noteId: string;
  title: string;
  content: string;
  flashcardCount: number;
}

export async function fetchUserFlashcards(
  userId: string
): Promise<GroupedNote[]> {
  const flashcards: FlashCardData[] = await getFlashCardsForUser(userId);

  const groupedByNote: Record<string, GroupedNote> = flashcards.reduce(
    (acc, curr) => {
      const noteId = curr.flashCards.noteId;

      if (!acc[noteId]) {
        acc[noteId] = {
          noteId,
          title: curr.notes.title,
          content: curr.notes.content,
          flashcardCount: 0,
        };
      }

      acc[noteId].flashcardCount++;
      return acc;
    },
    {} as Record<string, GroupedNote>
  );

  return Object.values(groupedByNote);
}
