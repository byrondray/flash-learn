"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { RichTextEditor } from "@/components/ui/enhanced-rich-text-editor";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { updateExistingNoteTitle, updateExistingNote, fetchNote, deleteExistingNote } from "./actions";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";
import { FileText, Brain, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
} from "@/components/ui/motion";
import { useCollaboration } from "@/hooks/useCollaboration";
import { CollaborationIndicator } from "@/components/ui/collaboration-indicator";
import { ShareNoteDialog } from "@/components/ui/share-note-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const [title, setTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [permission, setPermission] = useState<"edit" | "view">("edit");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const noteId = Array.isArray(id) ? id[0] : id;

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [debouncedTitle] = useDebounce(title, 2000);
  const [debouncedContent] = useDebounce(noteContent, 2000);

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
          setNoteContent(note.notes.content || "");
          setIsOwner(note.role === "owner");
          if (note.role === "collaborator" && note.permission) {
            setPermission(note.permission);
          }
        } else {
          setError("Note not found");
        }
      } catch (err) {
        console.error("Error loading note:", err);
        setError("Failed to load note");
      } finally {
        setIsLoading(false);
        setInitialLoadDone(true);
      }
    }

    loadNote();
  }, [noteId]);

  useEffect(() => {
    if (!initialLoadDone || !debouncedTitle || !noteId || !user?.id) return;
    let cancelled = false;
    (async () => {
      setIsSaving(true);
      try {
        await updateExistingNoteTitle(noteId, debouncedTitle);
      } catch (err) {
        if (!cancelled) console.error("Error saving title:", err);
      } finally {
        if (!cancelled) setIsSaving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedTitle, initialLoadDone, noteId, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = useCallback((html: string) => {
    setNoteContent(html);
  }, []);

  useEffect(() => {
    if (!initialLoadDone || !debouncedContent || !noteId || !user?.id || isConnected) return;
    updateExistingNote(noteId, title, debouncedContent).catch((err) =>
      console.error("Error saving content:", err)
    );
  }, [debouncedContent, initialLoadDone, noteId, user?.id, isConnected]);

  const canEdit = isOwner || permission === "edit";

  const handleDelete = async () => {
    if (!noteId) return;
    setIsDeleting(true);
    try {
      await deleteExistingNote(noteId);
      router.push(`/notes/viewAll/${user?.id}`);
    } catch (err) {
      console.error("Error deleting note:", err);
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
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
          <div className="px-4 mb-1 flex justify-end">
            <CollaborationIndicator
              isConnected={isConnected}
              isSynced={isSynced}
              activeUsers={activeUsers}
              currentUserId={user?.id}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 mb-4">
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
            <div className="flex-1 min-w-[200px]">
              <FadeIn delay={0.1}>
                <Input
                  placeholder="Note title"
                  value={title}
                  onChange={handleInputChange}
                  className="text-lg font-medium"
                  readOnly={!canEdit}
                />
              </FadeIn>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {noteId && (
                <HoverScale>
                  <ShareNoteDialog noteId={noteId} isOwner={isOwner} />
                </HoverScale>
              )}

              {canEdit && (
                <>
                  <HoverScale>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/flashCards/create/${noteId}`)}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Create Flash Cards</span>
                      <span className="sm:hidden">Cards</span>
                    </Button>
                  </HoverScale>
                  <HoverScale>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/quizQuestions/create/${noteId}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Create Quiz</span>
                      <span className="sm:hidden">Quiz</span>
                    </Button>
                  </HoverScale>
                </>
              )}
              {isOwner && (
                <HoverScale>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </HoverScale>
              )}
            </div>
          </div>
        </SlideIn>{" "}
        <FadeIn delay={0.2} className="flex-1 px-4">
          <RichTextEditor
            content={noteContent}
            onChange={handleContentChange}
            ydoc={ydoc}
            provider={provider}
            userName={user?.given_name || user?.email || undefined}
            userColor={userColor}
            editable={canEdit}
            className="min-h-[calc(100vh-200px)] w-full"
          />
        </FadeIn>
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Note</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this note? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
