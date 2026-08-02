import { getDB } from "@/database/client";
import { notes } from "@/database/schema/notes";
import { noteCollaborators } from "@/database/schema/noteCollaborators";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";

const db = getDB();

const noteColumns = {
  id: notes.id,
  userId: notes.userId,
  title: notes.title,
  content: notes.content,
  lastUpdated: notes.lastUpdated,
  inviteToken: notes.inviteToken,
};

// Used for share-token (anonymous/cross-account) access paths, which have
// no business seeing the owner's note content, `userId`, or the reusable
// `inviteToken` (that token alone is enough to join the note as a
// collaborator) — only enough to label the page.
const publicNoteColumns = {
  id: notes.id,
  title: notes.title,
};

export async function createNote(
  userId: string,
  title: string,
  content: string
) {
  return await db
    .insert(notes)
    .values({ id: uuid(), userId, title, content })
    .returning(noteColumns);
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
    .returning(noteColumns);
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
    .returning(noteColumns);
}

export async function deleteNote(noteId: string, userId: string) {
  return await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
}

export async function getNotesForUser(userId: string) {
  return await db
    .select({ notes: noteColumns })
    .from(notes)
    .where(eq(notes.userId, userId));
}

export async function getNoteById(noteId: string) {
  const r = await db
    .select({ notes: noteColumns })
    .from(notes)
    .where(eq(notes.id, noteId));
  return r[0];
}

// Safe to call for share-token (non-owner, non-collaborator) access — omits
// `content`, `userId`, and `inviteToken`.
export async function getPublicNoteById(noteId: string) {
  const r = await db
    .select({ notes: publicNoteColumns })
    .from(notes)
    .where(eq(notes.id, noteId));
  return r[0];
}

export async function getThreeMostRecentNotesForUser(userId: string) {
  return await db
    .select({ notes: noteColumns })
    .from(notes)
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.lastUpdated))
    .limit(3);
}

export async function getNotesForUserEditedThisWeek(userId: string) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return await db
    .select({ notes: noteColumns })
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
    .select({ notes: noteColumns })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
  return r[0] ?? null;
}

export async function getNoteWithAccess(noteId: string, userId: string) {
  const owned = await db
    .select({ notes: noteColumns })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (owned.length > 0) {
    return { ...owned[0], role: "owner" as const };
  }

  const shared = await db
    .select({ notes: noteColumns, permission: noteCollaborators.permission })
    .from(noteCollaborators)
    .innerJoin(notes, eq(noteCollaborators.noteId, notes.id))
    .where(
      and(
        eq(noteCollaborators.noteId, noteId),
        eq(noteCollaborators.userId, userId)
      )
    );

  if (shared.length > 0) {
    return {
      notes: shared[0].notes,
      role: "collaborator" as const,
      permission: shared[0].permission as "edit" | "view",
    };
  }

  return null;
}

// Both functions take `userId` and re-check for an `edit`-permission
// collaborator row via EXISTS, rather than trusting the caller to have
// already verified access. The only current callers (notes/[id]/actions.ts)
// do check first, but these are exported, general-purpose service
// functions with no auth logic of their own otherwise — a future caller
// that skips the canAccessNote gate would otherwise get an unauthenticated
// "update any note by ID" primitive.
export async function updateNoteAsCollaborator(
  noteId: string,
  userId: string,
  title: string,
  content: string
) {
  const lastUpdated = new Date().toISOString();
  return await db
    .update(notes)
    .set({ title, content, lastUpdated })
    .where(
      and(
        eq(notes.id, noteId),
        sql`EXISTS (
          SELECT 1 FROM ${noteCollaborators}
          WHERE ${noteCollaborators.noteId} = ${notes.id}
            AND ${noteCollaborators.userId} = ${userId}
            AND ${noteCollaborators.permission} = 'edit'
        )`
      )
    )
    .returning(noteColumns);
}

export async function updateNoteTitleAsCollaborator(
  noteId: string,
  userId: string,
  title: string
) {
  const lastUpdated = new Date().toISOString();
  return await db
    .update(notes)
    .set({ title, lastUpdated })
    .where(
      and(
        eq(notes.id, noteId),
        sql`EXISTS (
          SELECT 1 FROM ${noteCollaborators}
          WHERE ${noteCollaborators.noteId} = ${notes.id}
            AND ${noteCollaborators.userId} = ${userId}
            AND ${noteCollaborators.permission} = 'edit'
        )`
      )
    )
    .returning(noteColumns);
}

// The permission a fresh visitor gets is whatever the owner set here, not
// whatever the link happens to have in its query string — the token's
// permission lives in the DB (`invitePermission`) precisely so a client
// can't self-select "edit" access by editing the URL.
//
// Only writes `invitePermission` when creating the token for the first
// time. An existing token's permission is left untouched here — merely
// re-fetching an already-generated link (e.g. reopening the share dialog)
// must not silently change what a previously-distributed link grants.
// Owners change an existing link's permission explicitly via
// `setInviteTokenPermission`.
export async function getOrCreateInviteToken(
  noteId: string,
  userId: string,
  permission: "edit" | "view" = "edit"
) {
  const r = await db
    .select({ inviteToken: notes.inviteToken })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (r.length === 0) return null;

  if (r[0].inviteToken) {
    return r[0].inviteToken;
  }

  const token = uuid();
  await db
    .update(notes)
    .set({ inviteToken: token, invitePermission: permission })
    .where(eq(notes.id, noteId));

  return token;
}

// Fetches the invite token together with its *current* permission, without
// mutating anything — used to populate the share dialog so it reflects
// what the link actually grants right now, instead of the dialog's default
// UI state.
export async function getInviteTokenInfo(noteId: string, userId: string) {
  const r = await db
    .select({
      inviteToken: notes.inviteToken,
      invitePermission: notes.invitePermission,
    })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  return r[0] ?? null;
}

// Explicitly changes an existing invite link's permission — the only path
// that should ever mutate `invitePermission` after link creation.
export async function setInviteTokenPermission(
  noteId: string,
  userId: string,
  permission: "edit" | "view"
) {
  const r = await db
    .select({ inviteToken: notes.inviteToken })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (r.length === 0 || !r[0].inviteToken) return null;

  await db
    .update(notes)
    .set({ invitePermission: permission })
    .where(eq(notes.id, noteId));

  return r[0].inviteToken;
}

export async function getNoteByInviteToken(token: string) {
  const r = await db
    .select({
      notes: noteColumns,
      invitePermission: notes.invitePermission,
    })
    .from(notes)
    .where(eq(notes.inviteToken, token));
  return r[0] ?? null;
}

export async function getOrCreateQuizShareToken(
  noteId: string,
  userId: string
) {
  const r = await db
    .select({ quizShareToken: notes.quizShareToken })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (r.length === 0) return null;

  if (r[0].quizShareToken) return r[0].quizShareToken;

  const token = uuid();
  await db
    .update(notes)
    .set({ quizShareToken: token })
    .where(eq(notes.id, noteId));

  return token;
}

export async function getOrCreateFlashcardShareToken(
  noteId: string,
  userId: string
) {
  const r = await db
    .select({ flashcardShareToken: notes.flashcardShareToken })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)));

  if (r.length === 0) return null;

  if (r[0].flashcardShareToken) return r[0].flashcardShareToken;

  const token = uuid();
  await db
    .update(notes)
    .set({ flashcardShareToken: token })
    .where(eq(notes.id, noteId));

  return token;
}

export async function getNoteByQuizShareToken(token: string) {
  const r = await db
    .select({ notes: noteColumns })
    .from(notes)
    .where(eq(notes.quizShareToken, token));
  return r[0] ?? null;
}

export async function getNoteByFlashcardShareToken(token: string) {
  const r = await db
    .select({ notes: noteColumns })
    .from(notes)
    .where(eq(notes.flashcardShareToken, token));
  return r[0] ?? null;
}

// `shareToken`, when provided, must match the note's own share token —
// otherwise any authenticated user could pass `canAccessQuiz(noteId, userId)`
// for a note they have no relationship to, as soon as its owner shared it
// with anyone at all (the share token's actual value was never checked).
export async function canAccessQuiz(
  noteId: string,
  userId: string,
  shareToken?: string
) {
  const access = await getNoteWithAccess(noteId, userId);
  if (access) return true;

  if (!shareToken) return false;

  const note = await db
    .select({ quizShareToken: notes.quizShareToken })
    .from(notes)
    .where(eq(notes.id, noteId));

  return (
    note.length > 0 &&
    note[0].quizShareToken !== null &&
    note[0].quizShareToken === shareToken
  );
}

export async function canAccessFlashcards(
  noteId: string,
  userId: string,
  shareToken?: string
) {
  const access = await getNoteWithAccess(noteId, userId);
  if (access) return true;

  if (!shareToken) return false;

  const note = await db
    .select({ flashcardShareToken: notes.flashcardShareToken })
    .from(notes)
    .where(eq(notes.id, noteId));

  return (
    note.length > 0 &&
    note[0].flashcardShareToken !== null &&
    note[0].flashcardShareToken === shareToken
  );
}
