"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useDebounce } from "use-debounce";
import { RichTextEditor } from "@/components/ui/enhanced-rich-text-editor";
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
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  CollaborationService,
  CollaborationUser,
} from "@/services/collaboration.service";
import { CollaborationIndicator } from "@/components/ui/collaboration-indicator";

export default function NotePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldSave, setShouldSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [collaborationUsers, setCollaborationUsers] = useState<
    CollaborationUser[]
  >([]);
  const [isUpdatingFromCollaboration, setIsUpdatingFromCollaboration] =
    useState(false);

  const noteId = Array.isArray(id) ? id[0] : id;
  const collaborationServiceRef = useRef<CollaborationService | null>(null);

  const [debouncedTitle] = useDebounce(title, 2000);
  const [debouncedContent] = useDebounce(content, 2000);
  // WebSocket connection for real-time collaboration
  const websocketUrl =
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
    "wss://457dfe2wil.execute-api.us-east-2.amazonaws.com/dev";

  const {
    isConnected: isWebSocketConnected,
    isConnecting: isWebSocketConnecting,
    sendContentUpdate,
    activeUsers,
  } = useWebSocket({
    url: websocketUrl,
    userId: user?.id,
    noteId: noteId,
    onMessage: (message) => {
      collaborationServiceRef.current?.processMessage(message);
    },
    onUserJoined: (userId) => {
      console.log("User joined:", userId);
    },
    onUserLeft: (userId) => {
      console.log("User left:", userId);
    },
    onConnect: () => {
      console.log("Connected to collaboration server");
    },
    onDisconnect: () => {
      console.log("Disconnected from collaboration server");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Initialize collaboration service
  useEffect(() => {
    if (!collaborationServiceRef.current) {
      collaborationServiceRef.current = new CollaborationService(
        // onUsersUpdate
        (users) => {
          setCollaborationUsers(users);
        },
        // onContentUpdate
        (newContent, newTitle) => {
          setIsUpdatingFromCollaboration(true);
          if (newContent !== undefined) {
            setContent(newContent);
          }
          if (newTitle !== undefined) {
            setTitle(newTitle);
          }
          // Don't trigger save for collaborative updates
          setTimeout(() => {
            setIsUpdatingFromCollaboration(false);
          }, 100);
        },
        // onCursorUpdate
        (userId, position) => {
          console.log("Cursor update:", userId, position);
          // Handle cursor updates if needed
        }
      );
    }

    return () => {
      collaborationServiceRef.current?.destroy();
    };
  }, []);

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
    if (!user?.id || !noteId || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      console.log("Updating note:", { noteId, title, content });
      await updateExistingNote(noteId, title, content);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, noteId, title, content, isSaving]);
  useEffect(() => {
    if (!isLoading && !isUpdatingFromCollaboration) {
      setShouldSave(true);
    }
  }, [
    debouncedTitle,
    debouncedContent,
    isLoading,
    isUpdatingFromCollaboration,
  ]);

  useEffect(() => {
    if (shouldSave && !isLoading && !isUpdatingFromCollaboration) {
      console.log("Triggering save...");
      handleSave();
      setShouldSave(false);
    }
  }, [shouldSave, isLoading, isUpdatingFromCollaboration, handleSave]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    // Send real-time update for title changes
    if (isWebSocketConnected && !isUpdatingFromCollaboration) {
      sendContentUpdate(content, newTitle);
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Send real-time update for content changes
    if (isWebSocketConnected && !isUpdatingFromCollaboration) {
      sendContentUpdate(newContent, title);
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

            {/* Collaboration Indicator */}
            <CollaborationIndicator
              isConnected={isWebSocketConnected}
              isConnecting={isWebSocketConnecting}
              activeUsers={collaborationUsers}
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
            content={content}
            onChange={handleContentChange}
            placeholder="Start typing your notes here..."
            className="min-h-[calc(100vh-200px)] w-full"
          />
        </FadeIn>
      </div>
    </PageTransition>
  );
}
