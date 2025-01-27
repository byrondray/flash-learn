"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateFlashcardsAction } from "./actions";
import { FlashCards } from "@/database/schema/flashCards";

export default function CreateFlashCards() {
  const { id } = useParams() as { id: string };
  const [flashcards, setFlashcards] = useState<FlashCards[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleGenerateFlashcards() {
    setLoading(true);
    try {
      const cards = await generateFlashcardsAction(id);
      setFlashcards(cards);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create Flash Cards</h1>
        <Button onClick={handleGenerateFlashcards} disabled={loading}>
          {loading ? "Generating..." : "Generate Flash Cards"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {flashcards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Card {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Front:</h3>
                  <p>{card.question}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Back:</h3>
                  <p>{card.answer}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
