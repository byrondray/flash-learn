"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateFlashcardsAction, saveFlashCards } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X, Brain } from "lucide-react";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";

interface FlashCard {
  question: string;
  answer: string;
}

export default function CreateFlashCardsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(true);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const generateCards = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id;
        if (!noteId) {
          router.push("/");
          return;
        }

        const generatedCards = await generateFlashcardsAction(noteId);
        const formattedCards = generatedCards.map((card) => ({
          question: card.front,
          answer: card.back,
        }));        setFlashcards(formattedCards);
      } catch (error) {
        console.error("Error generating flashcards:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateCards();
  }, [id, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const noteId = Array.isArray(id) ? id[0] : id;
      if (noteId) {
        await saveFlashCards(noteId, flashcards);
      } else {
        throw new Error("Note ID is undefined");
      }
      router.push("/flashCards/view/" + noteId);
    } catch (error) {
      console.error("Error saving flashcards:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateFlashcard = (
    index: number,
    field: "question" | "answer",
    value: string
  ) => {
    const updatedCards = [...flashcards];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setFlashcards(updatedCards);
  };
  if (isGenerating) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <SlideIn direction="up">
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  Generating Flashcards
                </h2>
                <p className="text-sm text-muted-foreground">
                  AI is creating personalized flashcards from your notes...
                </p>
              </div>
            </SlideIn>
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Review Generated Flashcards
              </h1>
              <p className="text-muted-foreground">
                Edit the AI-generated content before saving
              </p>
            </div>
            <div className="space-x-4">
              <HoverScale>
                <Button variant="outline" onClick={() => router.back()}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </HoverScale>
              <HoverScale>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Flashcards
                    </>
                  )}
                </Button>
              </HoverScale>
            </div>
          </div>
        </SlideIn>

        <StaggerContainer className="grid gap-6">
          {flashcards.map((card, index) => (
            <StaggerItem key={index}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Flashcard {index + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FadeIn delay={0.1}>
                    <div>
                      <label className="text-sm font-medium text-blue-600">
                        Question:
                      </label>
                      <Textarea
                        value={card.question}
                        onChange={(e) =>
                          updateFlashcard(index, "question", e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter the question..."
                      />
                    </div>
                  </FadeIn>
                  <FadeIn delay={0.2}>
                    <div>
                      <label className="text-sm font-medium text-green-600">
                        Answer:
                      </label>
                      <Textarea
                        value={card.answer}
                        onChange={(e) =>
                          updateFlashcard(index, "answer", e.target.value)
                        }
                        className="mt-1"
                        placeholder="Enter the answer..."
                      />
                    </div>
                  </FadeIn>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {flashcards.length === 0 && (
          <FadeIn delay={0.3}>
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No flashcards were generated. Please try again or check your
                note content.
              </p>
            </div>
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}
