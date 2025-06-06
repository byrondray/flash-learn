"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { generateFlashcardsAction, saveFlashCards } from "./actions";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  X,
  Brain,
  Sparkles,
  Edit3,
  ArrowLeft,
  BookOpen,
  Lightbulb,
  Hash,
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
import { Separator } from "@/components/ui/separator";

interface FlashCard {
  question: string;
  answer: string;
}

// Loading skeleton component for flashcards
function FlashcardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-pulse" />
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreateFlashCardsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(true);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCards, setEditingCards] = useState<{ [key: number]: boolean }>(
    {}
  );

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
        }));
        setFlashcards(formattedCards);
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

  const deleteFlashcard = (index: number) => {
    const updatedCards = flashcards.filter((_, i) => i !== index);
    setFlashcards(updatedCards);
  };

  const noteId = Array.isArray(id) ? id[0] : id;

  if (isGenerating) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6 max-w-md">
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
              className="inline-block"
            >
              <div className="relative">
                <Brain className="h-16 w-16 text-primary" />
                <motion.div
                  className="absolute -inset-2"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="h-20 w-20 text-primary/20" />
                </motion.div>
              </div>
            </motion.div>

            <SlideIn direction="up">
              <div className="space-y-3">
                <h2 className="text-2xl font-bold">Generating Flashcards</h2>
                <p className="text-muted-foreground">
                  Our AI is analyzing your notes and creating personalized study
                  cards
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>This usually takes 10-15 seconds</span>
                </div>
              </div>
            </SlideIn>

            <Progress value={33} className="w-64 mx-auto" />

            <StaggerContainer className="space-y-3 mt-8">
              {[1, 2, 3].map((i) => (
                <StaggerItem key={i}>
                  <FlashcardSkeleton />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </PageTransition>
    );
  }

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
                  onClick={() => router.push(`/notes/${noteId}`)}
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
                  Review Generated Flashcards
                </h1>
                <p className="text-muted-foreground mt-2">
                  Edit and customize your AI-generated flashcards before saving
                </p>
              </div>

              <div className="flex gap-3">
                <HoverScale>
                  <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </HoverScale>
                <HoverScale>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || flashcards.length === 0}
                    size="lg"
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Flashcards
                      </>
                    )}
                  </Button>
                </HoverScale>
              </div>
            </div>
          </div>
        </SlideIn>

        {flashcards.length > 0 && (
          <FadeIn>
            <div className="flex items-center justify-between mb-6">
              <Badge variant="secondary" className="text-sm">
                {flashcards.length} Flashcards Generated
              </Badge>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Click any card to edit
              </p>
            </div>
          </FadeIn>
        )}

        <AnimatePresence>
          <StaggerContainer className="grid gap-6">
            {flashcards.map((card, index) => (
              <StaggerItem key={`card-${index}`}>
                <motion.div
                  layout
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`
                      group hover:shadow-lg transition-all duration-300 relative overflow-hidden
                      ${editingCards[index] ? "ring-2 ring-primary" : ""}
                    `}
                  >
                    {/* Card Header with Number Badge */}
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </span>
                            <span>Flashcard {index + 1}</span>
                          </div>
                        </CardTitle>
                        <HoverScale>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFlashcard(index)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </HoverScale>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Question Section */}
                      <FadeIn delay={0.1}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <label className="text-sm font-semibold text-blue-600">
                              Question / Front
                            </label>
                          </div>
                          <div className="relative">
                            <Textarea
                              value={card.question}
                              onChange={(e) =>
                                updateFlashcard(
                                  index,
                                  "question",
                                  e.target.value
                                )
                              }
                              onFocus={() =>
                                setEditingCards({
                                  ...editingCards,
                                  [index]: true,
                                })
                              }
                              onBlur={() =>
                                setEditingCards({
                                  ...editingCards,
                                  [index]: false,
                                })
                              }
                              className="min-h-[80px] resize-none pr-10 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                              placeholder="Enter the question or concept..."
                            />
                            <Hash className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50" />
                          </div>
                        </div>
                      </FadeIn>

                      <Separator className="my-4" />

                      {/* Answer Section */}
                      <FadeIn delay={0.2}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-green-600" />
                            <label className="text-sm font-semibold text-green-600">
                              Answer / Back
                            </label>
                          </div>
                          <div className="relative">
                            <Textarea
                              value={card.answer}
                              onChange={(e) =>
                                updateFlashcard(index, "answer", e.target.value)
                              }
                              onFocus={() =>
                                setEditingCards({
                                  ...editingCards,
                                  [index]: true,
                                })
                              }
                              onBlur={() =>
                                setEditingCards({
                                  ...editingCards,
                                  [index]: false,
                                })
                              }
                              className="min-h-[80px] resize-none pr-10 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                              placeholder="Enter the answer or explanation..."
                            />
                            <Sparkles className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50" />
                          </div>
                        </div>
                      </FadeIn>
                    </CardContent>

                    {/* Visual indicator for editing state */}
                    <AnimatePresence>
                      {editingCards[index] && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 4 }}
                          exit={{ height: 0 }}
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-primary/50 via-primary to-primary/50"
                        />
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimatePresence>

        {flashcards.length === 0 && !isGenerating && (
          <FadeIn delay={0.3}>
            <Card className="border-dashed border-2">
              <CardContent className="py-16">
                <div className="text-center space-y-4">
                  <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      No flashcards generated
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      We couldn't generate flashcards from your note. Please
                      ensure your note has enough content for flashcard
                      creation.
                    </p>
                  </div>
                  <HoverScale>
                    <Button variant="outline" onClick={() => router.back()}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Go Back
                    </Button>
                  </HoverScale>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {flashcards.length > 0 && (
          <SlideIn direction="up" className="mt-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Ready to start studying?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Save your flashcards to begin memorizing
                    </p>
                  </div>
                  <HoverScale>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      size="lg"
                      className="gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save & Start Studying
                        </>
                      )}
                    </Button>
                  </HoverScale>
                </div>
              </CardContent>
            </Card>
          </SlideIn>
        )}
      </div>
    </PageTransition>
  );
}
