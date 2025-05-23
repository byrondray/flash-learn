"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { updateExistingNote, fetchNote } from "./actions";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { FileText, Brain, Loader2, ArrowLeft } from "lucide-react";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
} from "@/components/ui/motion";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldSave, setShouldSave] = useState(false);

  const noteId = Array.isArray(id) ? id[0] : id;

  const [debouncedTitle] = useDebounce(title, 2000);
  const [debouncedContent] = useDebounce(content, 2000);

  useEffect(() => {
    async function loadNote() {
      if (!noteId) {
        setError("No note ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const note = await fetchNote(noteId);
        console.log("Fetched note:", note);
        if (note) {
          setTitle(note.notes.title || "");
          setContent(note.notes.content || "");
        } else {
          setError("Note not found");
        }
      } catch (error) {
        console.error("Error loading note:", error);
        setError("Failed to load note");
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [noteId]);

  const handleSave = useCallback(async () => {
    if (!user?.id || !noteId) {
      return;
    }

    try {
      console.log("Updating note:", { noteId, title, content });
      await updateExistingNote(noteId, title, content);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }, [user?.id, noteId, title, content]);

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
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  if (error) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 text-lg font-medium">{error}</div>
            <HoverScale>
              <Button
                variant="outline"
                onClick={() => router.push(`/notes/viewAll/${user?.id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Notes
              </Button>
            </HoverScale>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading note...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col h-full">
        <SlideIn direction="down">
          <div className="flex items-center gap-4 px-4 mb-4">
            <HoverScale>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/notes/viewAll/${user?.id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </HoverScale>
            <div className="flex-1">
              <FadeIn delay={0.1}>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={handleInputChange}
                  className="text-lg font-medium"
                />
              </FadeIn>
            </div>
            <HoverScale>
              <Button
                variant="outline"
                onClick={() => router.push(`/flashCards/create/${noteId}`)}
              >
                <Brain className="h-4 w-4 mr-2" />
                Create Flash Cards
              </Button>
            </HoverScale>
            <HoverScale>
              <Button
                variant="outline"
                onClick={() => router.push(`/quizQuestions/create/${noteId}`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </HoverScale>
          </div>
        </SlideIn>
        <FadeIn delay={0.2} className="flex-1 px-4">
          <Textarea
            placeholder="Start typing your notes here..."
            className="min-h-[calc(100vh-200px)] w-full resize-none border-0 focus:ring-0 text-base leading-relaxed"
            value={content}
            onChange={handleTextareaChange}
          />
        </FadeIn>
      </div>
    </PageTransition>
  );
}
