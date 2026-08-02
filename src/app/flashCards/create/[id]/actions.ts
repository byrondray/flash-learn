"use server";

import { createFlashCard } from "@/services/cards.service";
import { getNoteWithAccess, canEditNote } from "@/services/note.service";
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

  const access = await getNoteWithAccess(parsed.data, user.id);
  if (!canEditNote(access)) {
    throw new Error("Note not found");
  }

  return await generateFlashcards(access.notes.title, access.notes.content);
}

export async function saveFlashCards(
  noteId: string,
  flashcards: { question: string; answer: string }[]
) {
  const parsed = saveFlashCardsSchema.safeParse({ noteId, flashcards });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const access = await getNoteWithAccess(parsed.data.noteId, user.id);
  if (!canEditNote(access)) {
    throw new Error("Note not found");
  }

  const savedCards = await Promise.all(
    parsed.data.flashcards.map((card) =>
      createFlashCard(parsed.data.noteId, card.question, card.answer)
    )
  );
  return savedCards;
}
