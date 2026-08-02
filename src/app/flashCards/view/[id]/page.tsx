"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchFlashCardsAndNote,
  getFlashcardShareLink,
  checkIsNoteOwner,
  editFlashCard,
  removeFlashCard,
} from "./actions";
import { RotateCcw, Plus, Layers, Share2, Check, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
  ThreeDFlip,
} from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

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
  const searchParams = useSearchParams();
  const shareToken = searchParams.get("shareToken") ?? undefined;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [note, setNote] = useState<Note | null>(null);
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isOwner, setIsOwner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editState, setEditState] = useState<{
    cardId: string;
    question: string;
    answer: string;
    saving: boolean;
  } | null>(null);
  const [deleteState, setDeleteState] = useState<{
    cardId: string;
    deleting: boolean;
  } | null>(null);

  useEffect(() => {
    const loadFlashCards = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id;

        if (!noteId) {
          throw new Error("Note ID is undefined");
        }

        const [data, ownerStatus] = await Promise.all([
          fetchFlashCardsAndNote(noteId, shareToken),
          checkIsNoteOwner(noteId),
        ]);
        setFlashcards(data.flashcards);
        setNote(data.note);
        setIsOwner(ownerStatus);
      } catch (error) {
        console.error("Error loading flashcards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFlashCards();
  }, [id, shareToken]);

  const handleShare = async () => {
    const noteId = Array.isArray(id) ? id[0] : id;
    if (!noteId) return;
    const token = await getFlashcardShareLink(noteId);
    const url = `${window.location.origin}/flashCards/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCard = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const openEditDialog = (card: FlashCard) => {
    setEditState({
      cardId: card.flashCards.id,
      question: card.flashCards.question,
      answer: card.flashCards.answer,
      saving: false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    const { cardId, question, answer } = editState;
    setEditState((prev) => (prev ? { ...prev, saving: true } : prev));
    try {
      await editFlashCard(cardId, question, answer);
      setFlashcards((prev) =>
        prev.map((c) =>
          c.flashCards.id === cardId
            ? { flashCards: { ...c.flashCards, question, answer } }
            : c
        )
      );
      setEditState(null);
    } catch (error) {
      console.error("Error updating flashcard:", error);
      setEditState((prev) => (prev ? { ...prev, saving: false } : prev));
    }
  };

  const handleDelete = async () => {
    if (!deleteState) return;
    const { cardId } = deleteState;
    setDeleteState((prev) => (prev ? { ...prev, deleting: true } : prev));
    try {
      await removeFlashCard(cardId);
      setFlashcards((prev) => prev.filter((c) => c.flashCards.id !== cardId));
      setDeleteState(null);
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      setDeleteState((prev) => (prev ? { ...prev, deleting: false } : prev));
    }
  };

  if (isLoading) {
    return (
      <PageTransition>
        <div className="container mx-auto py-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-5 w-56" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="h-full">
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
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
              <h1 className="text-2xl font-bold">Flashcards</h1>
              <p className="text-sm text-muted-foreground">
                From note: {note?.notes.title || "Untitled"}
              </p>
            </div>
            <div className="flex gap-4">
              {isOwner && (
                <HoverScale>
                  <Button
                    variant="outline"
                    onClick={handleShare}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    {copied ? "Copied!" : "Share"}
                  </Button>
                </HoverScale>
              )}
              <HoverScale>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/notes/${id}`)}
                >
                  Back to Note
                </Button>
              </HoverScale>
            </div>
          </div>
        </SlideIn>

        {flashcards.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No Flashcards Yet"
            description="Generate flashcards from your note to start studying"
            actionLabel="Create Flashcards"
            onAction={() => router.push(`/flashCards/create/${id}`)}
          />
        ) : (
          <StaggerContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {" "}
            {flashcards.map((card) => (
              <StaggerItem key={card.flashCards.id}>
                <HoverScale scale={1.05}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all duration-300 h-full"
                    onClick={() => toggleCard(card.flashCards.id)}
                  >
                    {" "}
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{
                              rotate: flippedCards[card.flashCards.id] ? 180 : 0,
                            }}
                            transition={{
                              duration: 0.6,
                              ease: "easeInOut",
                              type: "tween",
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </motion.div>
                          {flippedCards[card.flashCards.id]
                            ? "Answer"
                            : "Question"}
                        </span>
                        {isOwner && (
                          <span className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(card);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteState({
                                  cardId: card.flashCards.id,
                                  deleting: false,
                                });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ThreeDFlip
                        isFlipped={flippedCards[card.flashCards.id] || false}
                        frontContent={
                          <div className="min-h-[100px] flex items-center justify-center text-center p-4 text-base">
                            {card.flashCards.question}
                          </div>
                        }
                        backContent={
                          <div className="min-h-[100px] flex items-center justify-center text-center p-4 text-sm leading-relaxed">
                            {card.flashCards.answer}
                          </div>
                        }
                        className="mb-4"
                      />
                    </CardContent>
                  </Card>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <FadeIn delay={0.4}>
          <div className="fixed bottom-8 right-8">
            <HoverScale scale={1.1}>
              <Button
                onClick={() => router.push(`/flashCards/create/${id}`)}
                className="shadow-lg"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create More
              </Button>
            </HoverScale>
          </div>
        </FadeIn>

        <Dialog
          open={!!editState}
          onOpenChange={(open) => !open && setEditState(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Flashcard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question</label>
                <Textarea
                  value={editState?.question ?? ""}
                  onChange={(e) =>
                    setEditState((prev) =>
                      prev ? { ...prev, question: e.target.value } : prev
                    )
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Answer</label>
                <Textarea
                  value={editState?.answer ?? ""}
                  onChange={(e) =>
                    setEditState((prev) =>
                      prev ? { ...prev, answer: e.target.value } : prev
                    )
                  }
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditState(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  !editState ||
                  editState.saving ||
                  !editState.question.trim() ||
                  !editState.answer.trim()
                }
              >
                {editState?.saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!deleteState}
          onOpenChange={(open) => !open && setDeleteState(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Flashcard</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this flashcard? This cannot be
              undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteState(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!!deleteState?.deleting}
              >
                {deleteState?.deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
