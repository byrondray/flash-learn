"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchFlashCardsAndNote } from "./actions";
import { Loader2, RotateCcw, Plus } from "lucide-react";
import { motion } from "framer-motion";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  SimpleFlip,
} from "@/components/ui/motion";

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
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">
              Loading flashcards...
            </p>
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
            <div className="space-x-4">
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
          <FadeIn delay={0.2}>
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No flashcards found for this note.
              </p>
              <HoverScale>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/flashCards/create/${id}`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Flashcards
                </Button>
              </HoverScale>
            </div>
          </FadeIn>
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
                      <SimpleFlip
                        isFlipped={flippedCards[card.flashCards.id] || false}
                        frontContent={
                          <div className="min-h-[100px] flex items-center justify-center text-center">
                            {card.flashCards.question}
                          </div>
                        }
                        backContent={
                          <div className="min-h-[100px] flex items-center justify-center text-center">
                            {card.flashCards.answer}
                          </div>
                        }
                        className="mb-4"
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Click to flip
                      </p>
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
