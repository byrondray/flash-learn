"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveNote } from "./actions";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Loader2, FileText } from "lucide-react";
import { PageTransition, FadeIn } from "@/components/ui/motion";

export default function NewNotePage() {
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createNewNote() {
      if (!user?.id) {
        // Wait for user to be loaded
        return;
      }

      if (isCreating) {
        // Prevent multiple calls
        return;
      }

      setIsCreating(true);
      setError(null);

      try {
        console.log("Creating new note for user:", user.id);

        // Create a new empty note
        const [newNote] = await saveNote(user.id, "", "");

        if (newNote?.id) {
          console.log("New note created with ID:", newNote.id);
          // Redirect to the note editor
          router.push(`/notes/${newNote.id}`);
        } else {
          throw new Error("Failed to create note - no ID returned");
        }
      } catch (error) {
        console.error("Error creating new note:", error);
        setError("Failed to create new note. Please try again.");
        setIsCreating(false);
      }
    }

    createNewNote();
  }, [user?.id, router, isCreating]);

  // Show error state if creation failed
  if (error) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 text-lg font-medium">{error}</div>
            <button
              onClick={() => router.push("/notes/viewAll/" + user?.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Notes
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }
  // Show loading state while creating note
  return (
    <PageTransition>
      <div className="flex items-center justify-center min-h-screen">
        <FadeIn>
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-background rounded-full flex items-center justify-center shadow-lg">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                Creating your note...
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Setting up your new note editor with auto-save functionality
              </p>
              <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                <span>This will only take a moment</span>
                <div className="flex space-x-1">
                  <div
                    className="w-1 h-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-current rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
