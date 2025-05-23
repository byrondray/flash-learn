"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { fetchUserFlashcards } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Search, Loader2 } from "lucide-react";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";

interface FlashcardSet {
  noteId: string;
  title: string;
  content: string;
  flashcardCount: number;
}

export default function FlashcardsOverviewPage() {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadFlashcardSets() {
      if (!user?.id) return;
      try {
        const data = await fetchUserFlashcards(user.id);
        setFlashcardSets(data);
      } catch (error) {
        console.error("Error loading flashcard sets:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFlashcardSets();
  }, [user?.id]);

  const filteredSets = flashcardSets.filter((set) =>
    set.title.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className="text-3xl font-bold">Flashcard Sets</h1>
                <p className="text-muted-foreground">
                  Select a set to start studying
                </p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search flashcard sets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </SlideIn>

          {flashcardSets.length === 0 ? (
            <FadeIn delay={0.2}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    No Flashcard Sets Available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Create flashcards for your notes to get started
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ) : (
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSets.map((set) => (
                <StaggerItem key={set.noteId}>
                  <HoverScale scale={1.03}>
                    <Card
                      className="hover:shadow-lg transition-shadow cursor-pointer group h-full"
                      onClick={() =>
                        router.push(`/flashCards/view/${set.noteId}`)
                      }
                    >
                      <CardHeader>
                        <CardTitle className="line-clamp-1 group-hover:text-primary">
                          {set.title}
                        </CardTitle>
                        <CardDescription>
                          {set.flashcardCount} card
                          {set.flashcardCount !== 1 ? "s" : ""}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {set.content}
                        </p>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {filteredSets.length === 0 && searchTerm && (
            <FadeIn>
              <div className="text-center py-12 text-muted-foreground">
                No flashcard sets match your search
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
