"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchFlashCardsAndNote } from "./actions";
import { Loader2 } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            From note: {note?.notes.title || "Untitled"}
          </p>
        </div>
        <div className="space-x-4">
          <Button variant="outline" onClick={() => router.push(`/notes/${id}`)}>
            Back to Note
          </Button>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No flashcards found for this note.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/flashCards/create/${id}`)}
          >
            Create Flashcards
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {flashcards.map((card) => (
            <Card
              key={card.flashCards.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => toggleCard(card.flashCards.id)}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {flippedCards[card.flashCards.id] ? "Answer" : "Question"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="min-h-[100px] flex items-center justify-center text-center">
                  {flippedCards[card.flashCards.id]
                    ? card.flashCards.answer
                    : card.flashCards.question}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Click to flip
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="fixed bottom-8 right-8">
        <Button
          onClick={() => router.push(`/flashCards/create/${id}`)}
          className="shadow-lg"
        >
          Create More Flashcards
        </Button>
      </div>
    </div>
  );
}
