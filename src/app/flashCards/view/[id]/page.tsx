"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchFlashCardsAndNote } from "./actions";
import { RotateCcw, Plus, Layers } from "lucide-react";
import { motion } from "framer-motion";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
  ThreeDFlip,
} from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface FlashCard {
  flashCards: {
    id: string;
    question: string;
    answer: string;
    noteId: string;
  };
}

interface Note {
  notes: {
    id: string;
    title: string;
  };
}

export default function ViewFlashCardsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const loadFlashCards = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id;

        if (!noteId) {
          throw new Error("Note ID is undefined");
        }

        const data = await fetchFlashCardsAndNote(noteId);
        setFlashcards(data.flashcards);
        setNote(data.note);
      } catch (error) {
        console.error("Error loading flashcards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlashCards();
  }, [id]);

  const toggleCard = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto py-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-56" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-full">
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto py-8 space-y-6">
        <SlideIn direction="down">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Flashcards</h1>
              <p className="text-sm text-muted-foreground">
                From note: {note?.notes.title || "Untitled"}
              </p>
            </div>
            <div className="flex gap-4">
              <HoverScale>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/notes/${id}`)}
                >
                  Back to Note
                </Button>
              </HoverScale>
            </div>
          </div>
        </SlideIn>

        {flashcards.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No Flashcards Yet"
            description="Generate flashcards from your note to start studying"
            actionLabel="Create Flashcards"
            onAction={() => router.push(`/flashCards/create/${id}`)}
          />
        ) : (
          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {" "}
            {flashcards.map((card) => (
              <StaggerItem key={card.flashCards.id}>
                <HoverScale scale={1.05}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 h-full"
                    onClick={() => toggleCard(card.flashCards.id)}
                  >
                    {" "}
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <motion.div
                          animate={{
                            rotate: flippedCards[card.flashCards.id] ? 180 : 0,
                          }}
                          transition={{
                            duration: 0.6,
                            ease: "easeInOut",
                            type: "tween",
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </motion.div>
                        {flippedCards[card.flashCards.id]
                          ? "Answer"
                          : "Question"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ThreeDFlip
                        isFlipped={flippedCards[card.flashCards.id] || false}
                        frontContent={
                          <div className="min-h-[100px] flex items-center justify-center text-center p-4 text-base">
                            {card.flashCards.question}
                          </div>
                        }
                        backContent={
                          <div className="min-h-[100px] flex items-center justify-center text-center p-4 text-sm leading-relaxed">
                            {card.flashCards.answer}
                          </div>
                        }
                        className="mb-4"
                      />
                    </CardContent>
                  </Card>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <FadeIn delay={0.4}>
          <div className="fixed bottom-8 right-8">
            <HoverScale scale={1.1}>
              <Button
                onClick={() => router.push(`/flashCards/create/${id}`)}
                className="shadow-lg"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create More
              </Button>
            </HoverScale>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
