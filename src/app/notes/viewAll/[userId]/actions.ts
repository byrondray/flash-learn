"use server";

import { getNotesForUser } from "@/services/note.service";

export async function fetchUserNotes(userId: string) {
  const notes = await getNotesForUser(userId);

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
