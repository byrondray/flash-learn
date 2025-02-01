"use client";

import { useState, useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { fetchUserTestScores } from "./actions";
import { formatTimeAgo } from "@/utils/formatTime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpDown, Calendar, Target } from "lucide-react";

interface TestScore {
  testScores: {
    id: string;
    score: string;
    dateAttempted: string;
  };
  notes: {
    id: string;
    title: string;
  };
}

export default function TestResultsPage() {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [scores, setScores] = useState<TestScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"date" | "score">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    async function loadScores() {
      if (!user?.id) return;
      try {
        const fetchedScores = await fetchUserTestScores(user.id);
        setScores(fetchedScores as TestScore[]);
      } catch (error) {
        console.error("Error loading test scores:", error);
      } finally {
        setLoading(false);
      }
    }
    loadScores();
  }, [user?.id]);

  const handleSort = (field: "date" | "score") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedScores = [...scores].sort((a, b) => {
    if (sortField === "date") {
      const dateA = new Date(a.testScores.dateAttempted);
      const dateB = new Date(b.testScores.dateAttempted);
      return sortDirection === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    } else {
      const scoreA = parseFloat(a.testScores.score);
      const scoreB = parseFloat(b.testScores.score);
      return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const averageScore = scores.length
    ? scores.reduce((acc, curr) => acc + parseFloat(curr.testScores.score), 0) /
      scores.length
    : 0;

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scores.length}</div>
              <p className="text-xs text-muted-foreground">All time attempts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Average Score
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(averageScore)}%
              </div>
              <Progress value={averageScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Latest Score
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scores.length
                  ? `${Math.round(parseFloat(scores[0].testScores.score))}%`
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {scores.length
                  ? formatTimeAgo(scores[0].testScores.dateAttempted)
                  : "No attempts yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>
              View all your quiz attempts and scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Note Title</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("score")}
                      className="hover:bg-transparent"
                    >
                      Score
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="hover:bg-transparent"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedScores.map((score) => (
                  <TableRow key={score.testScores.id}>
                    <TableCell className="font-medium">
                      {score.notes.title}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {Math.round(parseFloat(score.testScores.score))}%
                        <Progress
                          value={parseFloat(score.testScores.score)}
                          className="w-20"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatTimeAgo(score.testScores.dateAttempted)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/notes/${score.notes.id}`)}
                      >
                        View Note
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {scores.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                No test attempts yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
