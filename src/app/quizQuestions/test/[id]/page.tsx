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
import {
  PageTransition,
  SlideIn,
  FadeIn,
  ScaleIn,
  HoverScale,
  ModalAnimation,
} from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";

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
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 animate-spin" />
          </motion.div>
        </div>
      </PageTransition>
    );
  }
  if (questions.length === 0) {
    return (
      <PageTransition>
        <div className="container mx-auto py-8">
          <SlideIn direction="up">
            <Alert>
              <AlertTitle>No questions found</AlertTitle>
              <AlertDescription>
                There are no quiz questions available for this note.
              </AlertDescription>
            </Alert>
          </SlideIn>
        </div>
      </PageTransition>
    );
  }
  if (isComplete) {
    const score = calculateScore();
    return (
      <PageTransition>
        <div className="container mx-auto py-8">
          <FadeIn delay={0.2}>
            <ScaleIn>
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Quiz Complete!</CardTitle>
                  <CardDescription>Here&apos;s how you did:</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SlideIn direction="up" className="text-center">
                    <motion.p
                      className="text-4xl font-bold"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.3,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      {Math.round(score)}%
                    </motion.p>
                    <p className="text-muted-foreground">
                      {Math.round(score) >= 70
                        ? "Great job!"
                        : "Keep practicing!"}
                    </p>
                  </SlideIn>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    <Progress value={score} className="w-full" />
                  </motion.div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-4">
                  <HoverScale>
                    <Button
                      variant="outline"
                      onClick={() => setIsComplete(false)}
                    >
                      Review Answers
                    </Button>
                  </HoverScale>
                  <HoverScale>
                    <Button onClick={handleFinish} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {saving ? "Saving..." : "Finish"}
                    </Button>
                  </HoverScale>
                </CardFooter>
              </Card>
            </ScaleIn>
          </FadeIn>
        </div>
      </PageTransition>
    );
  }
  const currentQ = questions[currentQuestion];

  return (
    <PageTransition>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <FadeIn>
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${(currentQuestion / questions.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            >
              <Progress
                value={(currentQuestion / questions.length) * 100}
                className="w-full"
              />
            </motion.div>
          </FadeIn>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <SlideIn direction="left">
                      <span>
                        Question {currentQuestion + 1}/{questions.length}
                      </span>
                    </SlideIn>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SlideIn direction="up">
                    <p className="font-medium">{currentQ.question}</p>
                  </SlideIn>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <RadioGroup
                      value={selectedAnswers[currentQuestion]}
                      onValueChange={handleAnswer}
                      disabled={showExplanation}
                    >
                      {currentQ.options.map((option, index) => (
                        <motion.div
                          key={option.id}
                          className="flex items-center space-x-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                        >
                          <RadioGroupItem
                            value={option.optionText}
                            id={option.id}
                          />
                          <Label htmlFor={option.id}>{option.optionText}</Label>
                        </motion.div>
                      ))}
                    </RadioGroup>
                  </motion.div>

                  <ModalAnimation isOpen={showExplanation}>
                    <Alert
                      variant={
                        selectedAnswers[currentQuestion] ===
                        currentQ.correctAnswer
                          ? "default"
                          : "destructive"
                      }
                    >
                      <AlertTitle>
                        {selectedAnswers[currentQuestion] ===
                        currentQ.correctAnswer
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
                  </ModalAnimation>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <HoverScale>
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestion === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  </HoverScale>
                  <HoverScale>
                    <Button
                      onClick={handleNext}
                      disabled={!selectedAnswers[currentQuestion]}
                    >
                      {currentQuestion === questions.length - 1
                        ? "Complete"
                        : "Next"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </HoverScale>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
