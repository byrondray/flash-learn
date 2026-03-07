"use server";

import { getNoteByInviteToken } from "@/services/note.service";
import { addCollaborator } from "@/services/collaborator.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function acceptInvite(token: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const note = await getNoteByInviteToken(token);
  if (!note) return { success: false, error: "Invalid invite link" };

  if (note.notes.userId === user.id) {
    return { success: true, noteId: note.notes.id };
  }

  await addCollaborator(note.notes.id, user.id, "edit");
  return { success: true, noteId: note.notes.id };
}
