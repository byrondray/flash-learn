"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { saveNote, updateExistingNote, fetchNote } from "./actions";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useKindeBrowserClient().getUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(
    id ? (Array.isArray(id) ? id[0] : id) : null
  );
  const [isLoading, setIsLoading] = useState(!!noteId);
  const [shouldSave, setShouldSave] = useState(false);

  console.log("Current noteId:", noteId);

  const [debouncedTitle] = useDebounce(title, 2000);
  const [debouncedContent] = useDebounce(content, 2000);

  useEffect(() => {
    async function loadNote() {
      if (noteId) {
        try {
          const note = await fetchNote(noteId);
          console.log("Fetched note:", note);
          if (note) {
            setTitle(note.notes.title || "");
            setContent(note.notes.content || "");
          }
        } catch (error) {
          console.error("Error loading note:", error);
        }
      }
      setIsLoading(false);
    }

    loadNote();
  }, [noteId]);

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      console.log("No user ID found");
      return;
    }

    if (!title.trim() && !content.trim()) {
      return;
    }

    console.log("Saving note...", { noteId, title, content });

    try {
      if (noteId) {
        console.log("Updating existing note");
        await updateExistingNote(noteId, title, content);
      } else {
        console.log("Creating new note");
        const [newNote] = await saveNote(user.id, title, content);
        console.log("New note created:", newNote);
        if (newNote) {
          setNoteId(newNote.id);
          router.push(`/notes/${newNote.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }, [user?.id, noteId, title, content, router]);

  useEffect(() => {
    if (!isLoading) {
      setShouldSave(true);
    }
  }, [debouncedTitle, debouncedContent, isLoading]);

  useEffect(() => {
    if (shouldSave && !isLoading) {
      console.log("Triggering save...");
      handleSave();
      setShouldSave(false);
    }
  }, [shouldSave, isLoading, handleSave]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    console.log("Title changed:", e.target.value);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    console.log("Content changed:", e.target.value);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 px-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Note title"
            value={title}
            onChange={handleInputChange}
          />
        </div>
        <Button
          className="cursor-pointer"
          variant="outline"
          onClick={() => router.push(`/flashCards/create/${noteId}`)}
          disabled={!noteId}
        >
          Create Flash Cards
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => router.push(`/quizQuestions/create/${noteId}`)}
          disabled={!noteId}
        >
          Create Quiz
        </Button>
      </div>
      <div className="flex-1 px-4">
        <Textarea
          placeholder="Start typing..."
          className="min-h-[calc(100vh-200px)] w-full"
          value={content}
          onChange={handleTextareaChange}
        />
      </div>
    </div>
  );
}
