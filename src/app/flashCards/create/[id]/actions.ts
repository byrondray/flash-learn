"use server";

import { createFlashCard } from "@/services/cards.service";
import { getNoteByIdForUser } from "@/services/note.service";
import { generateFlashcards } from "@/utils/createAiQuestions";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { unstable_noStore as noStore } from "next/cache";
import { noteIdSchema, saveFlashCardsSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function generateFlashcardsAction(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${rateCheck.retryAfterSeconds}s`
    );
  }

  noStore();

  const note = await getNoteByIdForUser(parsed.data, user.id);
  if (!note) {
    throw new Error("Note not found");
  }

  return await generateFlashcards(note.notes.title, note.notes.content);
}

export async function saveFlashCards(
  noteId: string,
  flashcards: { question: string; answer: string }[]
) {
  const parsed = saveFlashCardsSchema.safeParse({ noteId, flashcards });
  if (!parsed.success) throw new Error("Invalid input");

  const savedCards = await Promise.all(
    parsed.data.flashcards.map((card) =>
      createFlashCard(parsed.data.noteId, card.question, card.answer)
    )
  );
  return savedCards;
}
