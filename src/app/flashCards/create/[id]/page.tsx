"use client";
// app/flashCards/create/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateFlashcardsAction, saveFlashCards } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

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
  const [generatedCards, setGeneratedCards] = useState<FlashCard[]>([]);

  useEffect(() => {
    const generateCards = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id;

        if (!noteId) {
          router.push("/");
        }

        if (noteId) {
          const generatedCards = await generateFlashcardsAction(noteId);
          setGeneratedCards(generatedCards);
        } else {
          throw new Error("Note ID is undefined");
        }
        setFlashcards(generatedCards);
      } catch (error) {
        console.error("Error generating flashcards:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateCards();
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const noteId = Array.isArray(id) ? id[0] : id;
      if (noteId) {
        await saveFlashCards(noteId, flashcards);
      } else {
        throw new Error("Note ID is undefined");
      }
      router.push("/notes/view" + noteId);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Generating flashcards...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Review Generated Flashcards</h1>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Flashcards"
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {flashcards.map((card, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Flashcard {index + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Question:</label>
                <Textarea
                  value={card.question}
                  onChange={(e) =>
                    updateFlashcard(index, "question", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Answer:</label>
                <Textarea
                  value={card.answer}
                  onChange={(e) =>
                    updateFlashcard(index, "answer", e.target.value)
                  }
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
