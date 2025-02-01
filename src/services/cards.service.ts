import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { flashCards, FlashCards } from "@/database/schema/flashCards";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";

const db = getDB();

export async function createFlashCard(
  noteId: string,
  question: string,
  answer: string
) {
  return await db
    .insert(flashCards)
    .values({ id: uuid(), noteId, question, answer })
    .returning();
}

export async function updateFlashCard(
  flashCardId: string,
  question: string,
  answer: string
) {
  return await db
    .update(flashCards)
    .set({ question, answer })
    .where(eq(flashCards.id, flashCardId))
    .returning();
}

export async function deleteFlashCard(flashCardId: string) {
  return await db.delete(flashCards).where(eq(flashCards.id, flashCardId));
}

export async function getFlashCardsForNoteId(noteId: string) {
  return await db
    .select({ flashCards })
    .from(flashCards)
    .where(eq(flashCards.noteId, noteId));
}

export async function getFlashCardsForUser(userId: string) {
  return await db
    .select({ flashCards, notes })
    .from(flashCards)
    .innerJoin(notes, eq(flashCards.noteId, notes.id))
    .where(eq(notes.userId, userId));
}
