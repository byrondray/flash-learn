"use server";

import { createFlashCard } from "@/services/cards.service";
import { getNoteById } from "@/services/note.service";
import { generateFlashcards } from "@/utils/createAiQuestions";
import { unstable_noStore as noStore } from "next/cache";

export async function generateFlashcardsAction(noteId: string) {
  const note = await getNoteById(noteId);

  noStore();

  if (!note) {
    throw new Error("Note not found");
  }

  return await generateFlashcards(note.notes.title, note.notes.content);
}

export async function saveFlashCards(
  noteId: string,
  flashcards: { question: string; answer: string }[]
) {
  const savedCards = await Promise.all(
    flashcards.map((card) =>
      createFlashCard(noteId, card.question, card.answer)
    )
  );
  return savedCards;
}
