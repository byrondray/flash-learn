"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { fetchUserNotes } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, FileText, Plus } from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTime";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";

interface Note {
  notes: {
    id: string;
    title: string;
    content: string;
    lastUpdated: string | null;
  };
}

export default function NotesOverviewPage() {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadNotes() {
      if (!user?.id) return;
      try {
        const data = await fetchUserNotes(user.id);
        setNotes(data);
      } catch (error) {
        console.error("Error loading notes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
  }, [user?.id]);

  const filteredNotes = notes.filter(
    (note) =>
      note.notes.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.notes.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageTransition>
    );
  }
  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <SlideIn direction="down">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">My Notes</h1>
                <p className="text-muted-foreground">
                  All your notes in one place
                </p>
              </div>
              <div className="flex gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <HoverScale>
                  <Button onClick={() => router.push("/notes/newNote")}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Note
                  </Button>
                </HoverScale>
              </div>
            </div>
          </SlideIn>

          {notes.length === 0 ? (
            <FadeIn delay={0.2}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No Notes Yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by creating your first note
                  </p>
                  <HoverScale>
                    <Button onClick={() => router.push("/notes/newNote")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Note
                    </Button>
                  </HoverScale>
                </CardContent>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotes.map((note) => (
                <StaggerItem key={note.notes.id}>
                  <HoverScale scale={1.03}>
                    <Card
                      className="hover:shadow-lg transition-shadow cursor-pointer group h-full"
                      onClick={() => router.push(`/notes/${note.notes.id}`)}
                    >
                      <CardHeader>
                        <CardTitle className="line-clamp-1 group-hover:text-primary">
                          {note.notes.title || "Untitled Note"}
                        </CardTitle>
                        <CardDescription>
                          Last edited{" "}
                          {formatTimeAgo(note.notes.lastUpdated ?? "")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {note.notes.content || "No content"}
                        </p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {filteredNotes.length === 0 && searchTerm && (
            <FadeIn>
              <div className="text-center py-12 text-muted-foreground">
                No notes match your search
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
