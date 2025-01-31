import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { and, eq } from "drizzle-orm";
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

export async function getThreeMostRecentNotesForUser(userId: string) {
  const r = await db
    .select({ notes })
    .from(notes)
    .where(eq(notes.userId, userId))
    // .orderBy(sql`CAST(${notes.lastUpdated} AS TIMESTAMP)`, sql`desc`) // this doesnt work
    .limit(3);

  return r.sort((a, b) => {
    return (
      new Date(b.notes.lastUpdated ?? 0).getTime() -
      new Date(a.notes.lastUpdated ?? 0).getTime()
    );
  });
}

export const getNotesForUserEditedThisWeek = async (userId: string) => {
  const allNotes = await db
    .select({ notes })
    .from(notes)
    .where(eq(notes.userId, userId));

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentNotes = allNotes.filter((note) => {
    const editDate = note.notes.lastUpdated
      ? new Date(note.notes.lastUpdated)
      : new Date(0);
    return editDate >= oneWeekAgo;
  });

  return recentNotes;
};
