"use server";

import {
  updateNote,
  updateNoteTitle,
  getNoteWithAccess,
  deleteNote,
  updateNoteTitleAsCollaborator,
  getOrCreateInviteToken,
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
import { revalidatePath } from "next/cache";
import {
  updateNoteSchema,
  updateNoteTitleSchema,
  noteIdSchema,
  shareNoteSchema,
  collaboratorActionSchema,
  updateCollaboratorSchema,
} from "@/lib/validations";

export async function updateExistingNote(
  noteId: string,
  title: string,
  content: string
) {
  const parsed = updateNoteSchema.safeParse({ noteId, title, content });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await updateNote(
    parsed.data.noteId,
    user.id,
    parsed.data.title,
    parsed.data.content
  );
}

export async function updateExistingNoteTitle(noteId: string, title: string) {
  const parsed = updateNoteTitleSchema.safeParse({ noteId, title });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const access = await canAccessNote(parsed.data.noteId, user.id);
  if (!access.canAccess) throw new Error("Unauthorized");

  if (access.role === "owner") {
    return await updateNoteTitle(
      parsed.data.noteId,
      user.id,
      parsed.data.title
    );
  }

  if (access.role === "collaborator" && access.permission === "edit") {
    return await updateNoteTitleAsCollaborator(
      parsed.data.noteId,
      parsed.data.title
    );
  }

  throw new Error("Insufficient permissions");
}

export async function deleteExistingNote(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  await deleteNote(parsed.data, user.id);
  revalidatePath(`/notes/viewAll/${user.id}`);
}

export async function fetchNote(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await getNoteWithAccess(parsed.data, user.id);
}

export async function shareNoteWithEmail(
  noteId: string,
  email: string,
  permission: "edit" | "view" = "edit"
) {
  const parsed = shareNoteSchema.safeParse({ noteId, email, permission });
  if (!parsed.success) {
    const emailError = parsed.error.flatten().fieldErrors.email;
    if (emailError) return { success: false, error: emailError[0] };
    return { success: false, error: "Invalid input" };
  }

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const ownerCheck = await isNoteOwner(parsed.data.noteId, user.id);
  if (!ownerCheck) throw new Error("Only the note owner can share");

  const targetUsers = await getUserByEmail(parsed.data.email);
  if (targetUsers.length === 0) {
    return { success: false, error: "No user found with that email" };
  }

  const targetUser = targetUsers[0];
  if (targetUser.users.id === user.id) {
    return { success: false, error: "You can't share a note with yourself" };
  }

  await addCollaborator(
    parsed.data.noteId,
    targetUser.users.id,
    parsed.data.permission
  );
  return { success: true };
}

export async function removeNoteCollaborator(
  noteId: string,
  collaboratorUserId: string
) {
  const parsed = collaboratorActionSchema.safeParse({
    noteId,
    collaboratorUserId,
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const ownerCheck = await isNoteOwner(parsed.data.noteId, user.id);
  if (!ownerCheck) throw new Error("Only the note owner can manage sharing");

  await removeCollaborator(parsed.data.noteId, parsed.data.collaboratorUserId);
  return { success: true };
}

export async function updateCollaboratorPermission(
  noteId: string,
  collaboratorUserId: string,
  permission: "edit" | "view"
) {
  const parsed = updateCollaboratorSchema.safeParse({
    noteId,
    collaboratorUserId,
    permission,
  });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const ownerCheck = await isNoteOwner(parsed.data.noteId, user.id);
  if (!ownerCheck) throw new Error("Only the note owner can manage sharing");

  await addCollaborator(
    parsed.data.noteId,
    parsed.data.collaboratorUserId,
    parsed.data.permission
  );
  return { success: true };
}

export async function fetchNoteCollaborators(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const access = await canAccessNote(parsed.data, user.id);
  if (!access.canAccess) throw new Error("Unauthorized");

  return await getCollaboratorsForNote(parsed.data);
}

export async function getInviteLink(noteId: string) {
  const parsed = noteIdSchema.safeParse(noteId);
  if (!parsed.success) throw new Error("Invalid note ID");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const ownerCheck = await isNoteOwner(parsed.data, user.id);
  if (!ownerCheck)
    throw new Error("Only the note owner can generate invite links");

  const token = await getOrCreateInviteToken(parsed.data, user.id);
  if (!token) throw new Error("Failed to generate invite link");

  return token;
}
