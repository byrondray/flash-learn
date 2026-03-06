import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { eq, and, desc, gte } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const db = getDB();

export async function createNote(
  userId: string,
  title: string,
  content: string
) {
  return await db
    .insert(notes)
    .values({ id: uuid(), userId, title, content })
    .returning();
}

export async function updateNote(
  noteId: string,
  userId: string,
  title: string,
  content: string
) {
  const lastUpdated = new Date().toISOString();
  return await db
    .update(notes)
    .set({ title, content, lastUpdated })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
}

export async function updateNoteTitle(
  noteId: string,
  userId: string,
  title: string
) {
  const lastUpdated = new Date().toISOString();
  return await db
    .update(notes)
    .set({ title, lastUpdated })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
}

export async function deleteNote(noteId: string, userId: string) {
  return await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

export async function getNotesForUser(userId: string) {
  return await db.select({ notes }).from(notes).where(eq(notes.userId, userId));
}

export async function getNoteById(noteId: string) {
  const r = await db.select({ notes }).from(notes).where(eq(notes.id, noteId));
  return r[0];
}

export async function getThreeMostRecentNotesForUser(userId: string) {
  return await db
    .select({ notes })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.lastUpdated))
    .limit(3);
}

export async function getNotesForUserEditedThisWeek(userId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await db
    .select({ notes })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        gte(notes.lastUpdated, oneWeekAgo.toISOString())
      )
    )
    .orderBy(desc(notes.lastUpdated));
}

export async function getNoteByIdForUser(noteId: string, userId: string) {
  const r = await db
    .select({ notes })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  return r[0] ?? null;
}
