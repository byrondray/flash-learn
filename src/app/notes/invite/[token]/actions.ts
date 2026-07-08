"use server";

import { getNoteByInviteToken } from "@/services/note.service";
import { addCollaboratorIfAbsent } from "@/services/collaborator.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function acceptInvite(
  token: string,
  permission: "edit" | "view" = "edit"
) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const note = await getNoteByInviteToken(token);
  if (!note) return { success: false, error: "Invalid invite link" };

  if (note.notes.userId === user.id) {
    return { success: true, noteId: note.notes.id };
  }

  // Only sets permission on first join; re-visiting the link (with a
  // different ?permission= value) cannot change an existing collaborator's
  // access level. Only the owner can change that, via updateCollaboratorPermission.
  await addCollaboratorIfAbsent(note.notes.id, user.id, permission);
  return { success: true, noteId: note.notes.id };
}
