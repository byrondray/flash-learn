import { getDB } from "@/database/client";
import { noteCollaborators } from "@/database/schema/noteCollaborators";
import { users } from "@/database/schema/users";
import { notes } from "@/database/schema/notes";
import { eq, and } from "drizzle-orm";

const db = getDB();

export async function addCollaborator(
  noteId: string,
  userId: string,
  permission: "edit" | "view" = "edit"
) {
  return await db
    .insert(noteCollaborators)
    .values({ noteId, userId, permission })
    .onConflictDoUpdate({
      target: [noteCollaborators.noteId, noteCollaborators.userId],
      set: { permission },
    })
    .returning();
}

export async function removeCollaborator(noteId: string, userId: string) {
  return await db
    .delete(noteCollaborators)
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.userId, userId)
      )
    );
}

export async function getCollaboratorsForNote(noteId: string) {
  return await db
    .select({
      userId: noteCollaborators.userId,
      email: users.email,
      permission: noteCollaborators.permission,
      addedAt: noteCollaborators.addedAt,
    })
    .from(noteCollaborators)
    .innerJoin(users, eq(noteCollaborators.userId, users.id))
    .where(eq(noteCollaborators.noteId, noteId));
}

export async function isCollaborator(noteId: string, userId: string) {
  const result = await db
    .select({ noteId: noteCollaborators.noteId })
    .from(noteCollaborators)
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.userId, userId)
      )
    );
  return result.length > 0;
}

export async function isNoteOwner(noteId: string, userId: string) {
  const result = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  return result.length > 0;
}

export async function canAccessNote(noteId: string, userId: string) {
  const ownerCheck = await isNoteOwner(noteId, userId);
  if (ownerCheck) return { canAccess: true, role: "owner" as const };

  const collabCheck = await db
    .select({ permission: noteCollaborators.permission })
    .from(noteCollaborators)
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.userId, userId)
      )
    );

  if (collabCheck.length > 0) {
    return {
      canAccess: true,
      role: "collaborator" as const,
      permission: collabCheck[0].permission as "edit" | "view",
    };
  }

  return { canAccess: false, role: null };
}

export async function getSharedNotesForUser(userId: string) {
  return await db
    .select({
      notes: {
        id: notes.id,
        title: notes.title,
        content: notes.content,
        lastUpdated: notes.lastUpdated,
        userId: notes.userId,
      },
      permission: noteCollaborators.permission,
      ownerEmail: users.email,
    })
    .from(noteCollaborators)
    .innerJoin(notes, eq(noteCollaborators.noteId, notes.id))
    .innerJoin(users, eq(notes.userId, users.id))
    .where(eq(noteCollaborators.userId, userId));
}
