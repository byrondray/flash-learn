"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateQuizQuestionsAction, saveQuizQuestions } from "./actionts";
import { Loader2 } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function CreateQuiz() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  async function handleSaveQuestions() {
    if (questions.length === 0) return;

    setSaving(true);
    try {
      await saveQuizQuestions(id, questions);
      router.push(`/quizQuestions/test/${id}`);
    } catch (error) {
      console.error("Error saving questions:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create Quiz</h1>
        <div className="space-x-4">
          <Button
            onClick={handleGenerateQuestions}
            disabled={loading || saving}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Questions"
            )}
          </Button>
          <Button
            onClick={handleSaveQuestions}
            disabled={questions.length === 0 || loading || saving}
            variant="default"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Quiz"
            )}
          </Button>
        </div>
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
                  {question.options.map((option, optionIndex) => (
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
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-medium">
                      {selectedAnswers[index] === question.correctAnswer
                        ? "✅ Correct!"
                        : "❌ Incorrect"}
                    </p>
                    {selectedAnswers[index] !== question.correctAnswer && (
                      <p className="text-sm">
                        The correct answer is: {question.correctAnswer}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {questions.length > 0 && (
          <div className="flex justify-end pt-6">
            <Button onClick={handleSaveQuestions} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Quiz...
                </>
              ) : (
                "Save and Continue"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
