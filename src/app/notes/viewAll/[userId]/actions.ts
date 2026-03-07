"use server";

import { getNotesForUser, deleteNote } from "@/services/note.service";
import { getSharedNotesForUser } from "@/services/collaborator.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";

export async function fetchUserNotes() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  const notes = await getNotesForUser(user.id);

  return notes.sort((a, b) => {
    const dateA = a.notes.lastUpdated
      ? new Date(a.notes.lastUpdated).getTime()
      : 0;
    const dateB = b.notes.lastUpdated
      ? new Date(b.notes.lastUpdated).getTime()
      : 0;

    if (dateA === 0 && dateB === 0) {
      return 0;
    }

    if (dateA === 0) return 1;
    if (dateB === 0) return -1;

    return dateB - dateA;
  });
}

export async function fetchSharedNotes() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await getSharedNotesForUser(user.id);
}

export async function deleteExistingNote(noteId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  await deleteNote(noteId, user.id);
  revalidatePath(`/notes/viewAll/${user.id}`);
}
