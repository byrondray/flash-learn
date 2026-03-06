"use server";

import { getNotesForUser } from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

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
