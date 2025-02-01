"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchQuizQuestions, saveTestScore } from "./actions";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";

interface Question {
  id: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  options: Array<{
    id: string;
    optionText: string;
  }>;
}

export default function TestPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const fetchedQuestions = await fetchQuizQuestions(id);
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [id]);

  const handleAnswer = (answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setShowExplanation(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const score = calculateScore();
      await saveTestScore(questions[0].id, score);
      router.push(`/notes/${id}`);
    } catch (error) {
      console.error("Error saving test score:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTitle>No questions found</AlertTitle>
          <AlertDescription>
            There are no quiz questions available for this note.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isComplete) {
    const score = calculateScore();
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Quiz Complete!</CardTitle>
            <CardDescription>Here's how you did:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold">{Math.round(score)}%</p>
              <p className="text-muted-foreground">
                {Math.round(score) >= 70 ? "Great job!" : "Keep practicing!"}
              </p>
            </div>
            <Progress value={score} className="w-full" />
          </CardContent>
          <CardFooter className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setIsComplete(false)}>
              Review Answers
            </Button>
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Finish"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Progress
          value={(currentQuestion / questions.length) * 100}
          className="w-full"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              <span>
                Question {currentQuestion + 1}/{questions.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">{currentQ.question}</p>
            <RadioGroup
              value={selectedAnswers[currentQuestion]}
              onValueChange={handleAnswer}
              disabled={showExplanation}
            >
              {currentQ.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.optionText} id={option.id} />
                  <Label htmlFor={option.id}>{option.optionText}</Label>
                </div>
              ))}
            </RadioGroup>

            {showExplanation && (
              <Alert
                variant={
                  selectedAnswers[currentQuestion] === currentQ.correctAnswer
                    ? "default"
                    : "destructive"
                }
              >
                <AlertTitle>
                  {selectedAnswers[currentQuestion] === currentQ.correctAnswer
                    ? "Correct!"
                    : "Incorrect"}
                </AlertTitle>
                <AlertDescription className="space-y-2">
                  {selectedAnswers[currentQuestion] !==
                    currentQ.correctAnswer && (
                    <p>The correct answer is: {currentQ.correctAnswer}</p>
                  )}
                  <p>{currentQ.explanation}</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion]}
            >
              {currentQuestion === questions.length - 1 ? "Complete" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
