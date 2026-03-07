"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { fetchUserNotes, fetchSharedNotes } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Plus, Users } from "lucide-react";
import { formatTimeAgo } from "@/utils/formatTime";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Note {
  notes: {
    id: string;
    title: string;
    content: string;
    lastUpdated: string | null;
  };
}

interface SharedNote {
  notes: {
    id: string;
    title: string;
    content: string;
    lastUpdated: string | null;
    userId: string;
  };
  permission: string;
  ownerEmail: string;
}

export default function NotesOverviewPage() {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const stripHtml = (html: string | object) => {
    if (typeof html !== "string") return "";
    return html.replace(/<[^>]+>/g, "");
  };

  useEffect(() => {
    async function loadNotes() {
      if (!user?.id) return;
      try {
        const [data, shared] = await Promise.all([
          fetchUserNotes(),
          fetchSharedNotes(),
        ]);
        setNotes(data);
        setSharedNotes(shared);
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
        <div className="container mx-auto py-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-5 w-64" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-28" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="min-h-[200px]">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-2" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
            <EmptyState
              icon={FileText}
              title="No Notes Yet"
              description="Start by creating your first note"
              actionLabel="Create Note"
              onAction={() => router.push("/notes/newNote")}
            />
          ) : (
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {filteredNotes.map((note) => (
                <StaggerItem key={note.notes.id}>
                  <HoverScale scale={1.03}>
                    <Card
                      className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer group min-h-[200px]"
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
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {note.notes.content
                            ? stripHtml(note.notes.content)
                            : "No content"}
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

          {sharedNotes.length > 0 && (
            <FadeIn delay={0.3}>
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-xl font-semibold">Shared with me</h2>
                </div>
                <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {sharedNotes.map((note) => (
                    <StaggerItem key={note.notes.id}>
                      <HoverScale scale={1.03}>
                        <Card
                          className="flex flex-col hover:shadow-lg transition-shadow cursor-pointer group min-h-[200px] border-primary/20"
                          onClick={() => router.push(`/notes/${note.notes.id}`)}
                        >
                          <CardHeader>
                            <CardTitle className="line-clamp-1 group-hover:text-primary">
                              {note.notes.title || "Untitled Note"}
                            </CardTitle>
                            <CardDescription>
                              Shared by {note.ownerEmail}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {note.notes.content
                                ? stripHtml(note.notes.content)
                                : "No content"}
                            </p>
                          </CardContent>
                        </Card>
                      </HoverScale>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
