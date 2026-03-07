"use server";

import {
  updateNote,
  updateNoteTitle,
  getNoteByIdForUser,
  getNoteWithAccess,
  deleteNote,
  updateNoteTitleAsCollaborator,
} from "@/services/note.service";
import {
  addCollaborator,
  removeCollaborator,
  getCollaboratorsForNote,
  canAccessNote,
  isNoteOwner,
} from "@/services/collaborator.service";
import { getUserByEmail } from "@/services/user.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function updateExistingNote(
  noteId: string,
  title: string,
  content: string
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await updateNote(noteId, user.id, title, content);
}

export async function updateExistingNoteTitle(noteId: string, title: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const access = await canAccessNote(noteId, user.id);
  if (!access.canAccess) throw new Error("Unauthorized");

  if (access.role === "owner") {
    return await updateNoteTitle(noteId, user.id, title);
  }

  if (access.role === "collaborator" && access.permission === "edit") {
    return await updateNoteTitleAsCollaborator(noteId, title);
  }

  throw new Error("Insufficient permissions");
}

export async function deleteExistingNote(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await deleteNote(noteId, user.id);
}

export async function fetchNote(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await getNoteWithAccess(noteId, user.id);
}

export async function shareNoteWithEmail(noteId: string, email: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const ownerCheck = await isNoteOwner(noteId, user.id);
  if (!ownerCheck) throw new Error("Only the note owner can share");

  const targetUsers = await getUserByEmail(email);
  if (targetUsers.length === 0) {
    return { success: false, error: "No user found with that email" };
  }

  const targetUser = targetUsers[0];
  if (targetUser.users.id === user.id) {
    return { success: false, error: "You can't share a note with yourself" };
  }

  await addCollaborator(noteId, targetUser.users.id);
  return { success: true };
}

export async function removeNoteCollaborator(
  noteId: string,
  collaboratorUserId: string
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const ownerCheck = await isNoteOwner(noteId, user.id);
  if (!ownerCheck) throw new Error("Only the note owner can manage sharing");

  await removeCollaborator(noteId, collaboratorUserId);
  return { success: true };
}

export async function fetchNoteCollaborators(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const access = await canAccessNote(noteId, user.id);
  if (!access.canAccess) throw new Error("Unauthorized");

  return await getCollaboratorsForNote(noteId);
}
