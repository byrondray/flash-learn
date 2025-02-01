"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { fetchAvailableQuizzes } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, BookOpen, ArrowRight } from "lucide-react";

interface QuizNote {
  note: {
    id: string;
    title: string;
    content: string;
  };
  questionCount: number;
}

export default function AvailableQuizzesPage() {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadQuizzes() {
      if (!user?.id) return;
      try {
        const data = await fetchAvailableQuizzes(user.id);
        setQuizzes(data);
      } catch (error) {
        console.error("Error loading quizzes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadQuizzes();
  }, [user?.id]);

  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Available Quizzes</h1>
            <p className="text-muted-foreground">
              Select a note to start its quiz
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Quizzes Available</p>
              <p className="text-sm text-muted-foreground">
                Create a quiz for your notes to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => (
              <Card
                key={quiz.note.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/test/${quiz.note.id}`)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1">
                    {quiz.note.title}
                  </CardTitle>
                  <CardDescription>
                    {quiz.questionCount} question
                    {quiz.questionCount !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {quiz.note.content}
                    </p>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredQuizzes.length === 0 && searchTerm && (
          <div className="text-center py-12 text-muted-foreground">
            No quizzes match your search
          </div>
        )}
      </div>
    </div>
  );
}
