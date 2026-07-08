"use server";

import { createNote } from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { saveNoteSchema } from "@/lib/validations";

export async function saveNote(title: string, content: string) {
  const parsed = saveNoteSchema.safeParse({ title, content });
  if (!parsed.success) throw new Error("Invalid input");

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("Unauthorized");
  return await createNote(user.id, parsed.data.title, parsed.data.content);
}
