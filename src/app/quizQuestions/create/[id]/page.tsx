"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuizQuestions } from "@/database/schema/quizQuestions";
import { generateQuizQuestionsAction } from "./actionts";

export default function CreateQuiz() {
  const { id } = useParams() as { id: string };
  const [questions, setQuestions] = useState<QuizQuestions[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});

  async function handleGenerateQuestions() {
    setLoading(true);
    try {
      const newQuestions = await generateQuizQuestionsAction(id);
      setQuestions(newQuestions);
    } catch (error) {
      console.error("Error generating questions:", error);
    }
    setLoading(false);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create Quiz</h1>
        <Button onClick={handleGenerateQuestions} disabled={loading}>
          {loading ? "Generating..." : "Generate Questions"}
        </Button>
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="font-medium">{question.question}</p>
                <RadioGroup
                  value={selectedAnswers[index]}
                  onValueChange={(value) =>
                    setSelectedAnswers((prev) => ({ ...prev, [index]: value }))
                  }
                >
                  {question.answer.split(",").map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={option}
                        id={`q${index}-${optionIndex}`}
                      />
                      <Label htmlFor={`q${index}-${optionIndex}`}>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {selectedAnswers[index] && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="font-medium">
                      {selectedAnswers[index] === question.answer
                        ? "✅ Correct!"
                        : "❌ Incorrect"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
