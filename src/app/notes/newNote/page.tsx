"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { saveNote, updateExistingNote } from "./actions";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useKindeAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState(Array.isArray(id) ? id[0] : id);
  const [debouncedTitle] = useDebounce(title, 2000);
  const [debouncedContent] = useDebounce(content, 2000);

  useEffect(() => {
    if (debouncedTitle || debouncedContent) {
      handleSave();
    }
  }, [debouncedTitle, debouncedContent]);

  async function handleSave() {
    if (!user?.id) return;

    if (noteId) {
      await updateExistingNote(noteId, title, content);
    } else {
      const [newNote] = await saveNote(user.id, title, content);
      setNoteId(newNote.id);
      router.push(`/notes/${newNote.id}`);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="w-96 px-4 mb-4">
        <Input
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex-1 px-4">
        <Textarea
          placeholder="Start typing..."
          className="min-h-[calc(100vh-200px)] w-full"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
    </div>
  );
}
