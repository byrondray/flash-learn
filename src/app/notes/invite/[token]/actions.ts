"use server";

import { getNoteByInviteToken } from "@/services/note.service";
import { addCollaboratorIfAbsent } from "@/services/collaborator.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { shareTokenSchema } from "@/lib/validations";

export async function acceptInvite(token: string) {
  const parsed = shareTokenSchema.safeParse(token);
  if (!parsed.success) return { success: false, error: "Invalid invite link" };

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");

  const note = await getNoteByInviteToken(parsed.data);
  if (!note) return { success: false, error: "Invalid invite link" };

  if (note.notes.userId === user.id) {
    return { success: true, noteId: note.notes.id };
  }

  // The permission comes from the note's own `invitePermission` column, set
  // by the owner when they generated/last updated the link — never from the
  // client, which previously could self-select "edit" via a `?permission=`
  // query param regardless of what the owner intended to share.
  // Only sets permission on first join; re-visiting the link cannot change
  // an existing collaborator's access level. Only the owner can change that,
  // via updateCollaboratorPermission.
  await addCollaboratorIfAbsent(
    note.notes.id,
    user.id,
    note.invitePermission
  );
  return { success: true, noteId: note.notes.id };
}
