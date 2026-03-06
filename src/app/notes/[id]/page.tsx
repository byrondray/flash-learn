"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { RichTextEditor } from "@/components/ui/enhanced-rich-text-editor";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { updateExistingNoteTitle, fetchNote } from "./actions";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { FileText, Brain, Loader2, ArrowLeft } from "lucide-react";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
} from "@/components/ui/motion";
import { useCollaboration } from "@/hooks/useCollaboration";
import { CollaborationIndicator } from "@/components/ui/collaboration-indicator";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const noteId = Array.isArray(id) ? id[0] : id;

  const [debouncedTitle] = useDebounce(title, 2000);

  const collabUrl =
    process.env.NEXT_PUBLIC_COLLAB_URL || "ws://localhost:8080";

  const { ydoc, provider, isConnected, isSynced, activeUsers, userColor } =
    useCollaboration({
      noteId,
      userId: user?.id,
      userName: user?.given_name || user?.email || undefined,
      collabUrl,
    });

  useEffect(() => {
    async function loadNote() {
      if (!noteId) {
        setError("No note ID provided");
        setIsLoading(false);
        return;
      }

      try {
        const note = await fetchNote(noteId);
        if (note) {
          setTitle(note.notes.title || "");
        } else {
          setError("Note not found");
        }
      } catch (err) {
        console.error("Error loading note:", err);
        setError("Failed to load note");
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [noteId]);

  const handleTitleSave = useCallback(async () => {
    if (!user?.id || !noteId || isSaving) return;
    setIsSaving(true);
    try {
      await updateExistingNoteTitle(noteId, title);
    } catch (err) {
      console.error("Error saving title:", err);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, noteId, title, isSaving]);

  useEffect(() => {
    if (!isLoading && debouncedTitle) {
      handleTitleSave();
    }
  }, [debouncedTitle, isLoading, handleTitleSave]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
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
        {" "}
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

            <CollaborationIndicator
              isConnected={isConnected}
              isSynced={isSynced}
              activeUsers={activeUsers}
              currentUserId={user?.id}
            />

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
        </SlideIn>{" "}
        <FadeIn delay={0.2} className="flex-1 px-4">
          <RichTextEditor
            content=""
            onChange={() => {}}
            ydoc={ydoc}
            provider={provider}
            userName={user?.given_name || user?.email || undefined}
            userColor={userColor}
            className="min-h-[calc(100vh-200px)] w-full"
          />
        </FadeIn>
      </div>
    </PageTransition>
  );
}
