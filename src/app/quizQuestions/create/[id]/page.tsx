"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { generateQuizQuestionsAction, saveQuizQuestions } from "./actionts";
import {
  Loader2,
  Brain,
  Sparkles,
  CheckCircle2,
  XCircle,
  Save,
  ArrowLeft,
  Info,
  Lightbulb,
} from "lucide-react";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
} from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// Loading skeleton component for questions
function QuestionSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-pulse" />
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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
  const [showAnswers, setShowAnswers] = useState<{ [key: number]: boolean }>(
    {}
  );

  async function handleGenerateQuestions() {
    setLoading(true);
    setQuestions([]);
    setSelectedAnswers({});
    setShowAnswers({});

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

  const handleAnswerSelect = (questionIndex: number, value: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: value,
    }));
    setShowAnswers((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8 max-w-4xl">
        <SlideIn direction="down">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <HoverScale>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/notes/${id}`)}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Note
                </Button>
              </HoverScale>
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Brain className="h-8 w-8 text-primary" />
                  Create Quiz
                </h1>
                <p className="text-muted-foreground mt-2">
                  Generate AI-powered quiz questions from your notes
                </p>
              </div>

              <div className="flex gap-3">
                <HoverScale>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={loading || saving}
                    size="lg"
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate Questions
                      </>
                    )}
                  </Button>
                </HoverScale>

                {questions.length > 0 && (
                  <HoverScale>
                    <Button
                      onClick={handleSaveQuestions}
                      disabled={loading || saving}
                      variant="default"
                      size="lg"
                      className="gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Quiz
                        </>
                      )}
                    </Button>
                  </HoverScale>
                )}
              </div>
            </div>
          </div>
        </SlideIn>

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <FadeIn>
                <Card className="border-dashed border-2 bg-muted/20">
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block"
                      >
                        <Brain className="h-12 w-12 text-primary" />
                      </motion.div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          AI is analyzing your notes...
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Creating thoughtful questions that test understanding
                          and knowledge retention
                        </p>
                      </div>
                      <Progress value={33} className="w-64 mx-auto" />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <StaggerContainer className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <StaggerItem key={i}>
                    <QuestionSkeleton />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions Display */}
        {!loading && questions.length === 0 && (
          <FadeIn>
            <Card className="border-dashed border-2">
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <Lightbulb className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      Ready to create a quiz?
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Click "Generate Questions" to create AI-powered quiz
                      questions based on your notes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {!loading && questions.length > 0 && (
          <>
            <FadeIn>
              <div className="flex items-center justify-between mb-6">
                <Badge variant="secondary" className="text-sm">
                  {questions.length} Questions Generated
                </Badge>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Select answers to preview feedback
                </p>
              </div>
            </FadeIn>

            <StaggerContainer className="space-y-6">
              {questions.map((question, index) => (
                <StaggerItem key={index}>
                  <Card className="group hover:shadow-md transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </span>
                          Question {index + 1}
                        </CardTitle>
                        {selectedAnswers[index] && (
                          <ScaleIn>
                            <Badge
                              variant={
                                selectedAnswers[index] ===
                                question.correctAnswer
                                  ? "default"
                                  : "destructive"
                              }
                              className="gap-1"
                            >
                              {selectedAnswers[index] ===
                              question.correctAnswer ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3" />
                                  Correct
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Incorrect
                                </>
                              )}
                            </Badge>
                          </ScaleIn>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="font-medium text-lg leading-relaxed">
                        {question.question}
                      </p>

                      <RadioGroup
                        value={selectedAnswers[index]}
                        onValueChange={(value) =>
                          handleAnswerSelect(index, value)
                        }
                        className="space-y-3"
                      >
                        {question.options.map((option, optionIndex) => (
                          <motion.div
                            key={optionIndex}
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Label
                              htmlFor={`q${index}-${optionIndex}`}
                              className={`
                                flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all
                                ${
                                  selectedAnswers[index] === option
                                    ? option === question.correctAnswer
                                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                      : "border-red-500 bg-red-50 dark:bg-red-950/20"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }
                              `}
                            >
                              <RadioGroupItem
                                value={option}
                                id={`q${index}-${optionIndex}`}
                                className="mt-0"
                              />
                              <span className="flex-1">{option}</span>
                              {selectedAnswers[index] === option && (
                                <ScaleIn>
                                  {option === question.correctAnswer ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </ScaleIn>
                              )}
                            </Label>
                          </motion.div>
                        ))}
                      </RadioGroup>

                      <AnimatePresence>
                        {showAnswers[index] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Card
                              className={`
                              mt-4 border-2
                              ${
                                selectedAnswers[index] ===
                                question.correctAnswer
                                  ? "border-green-200 bg-green-50/50 dark:bg-green-950/10"
                                  : "border-orange-200 bg-orange-50/50 dark:bg-orange-950/10"
                              }
                            `}
                            >
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start gap-2">
                                  <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <div className="space-y-2">
                                    {selectedAnswers[index] !==
                                      question.correctAnswer && (
                                      <p className="text-sm font-medium">
                                        Correct answer:{" "}
                                        <span className="text-green-700 dark:text-green-400">
                                          {question.correctAnswer}
                                        </span>
                                      </p>
                                    )}
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {question.explanation}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <SlideIn direction="up" className="mt-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">
                        Ready to save your quiz?
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Review your questions and save them to start testing
                      </p>
                    </div>
                    <HoverScale>
                      <Button
                        onClick={handleSaveQuestions}
                        disabled={saving}
                        size="lg"
                        className="gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving Quiz...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save and Continue
                          </>
                        )}
                      </Button>
                    </HoverScale>
                  </div>
                </CardContent>
              </Card>
            </SlideIn>
          </>
        )}
      </div>
    </PageTransition>
  );
}
