import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const db = getDB();

export async function createNote(
  userId: string,
  title: string,
  content: string
) {
  console.log("createNote");
  return await db
    .insert(notes)
    .values({ id: uuid(), userId, title, content })
    .returning();
}

export async function updateNote(
  noteId: string,
  title: string,
  content: string
) {
  console.log("updateNote");
  const lastUpdated = new Date().toISOString();
  return await db
    .update(notes)
    .set({ title, content, lastUpdated })
    .where(eq(notes.id, noteId))
    .returning();
}

export async function deleteNote(noteId: string) {
  return await db.delete(notes).where(eq(notes.id, noteId));
}

export async function getNotesForUser(userId: string) {
  return await db.select({ notes }).from(notes).where(eq(notes.userId, userId));
}

export async function getNoteById(noteId: string) {
  const r = await db.select({ notes }).from(notes).where(eq(notes.id, noteId));
  console.log("getNoteById", r);
  return r[0];
}
