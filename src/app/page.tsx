import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getThreeMostRecentNotesForUser } from "@/services/note.service";
import { checkAndStoreKindeUser } from "@/utils/checkAndStoreKindeUser";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { BarChart, BookOpen, Brain, Plus } from "lucide-react";
import Link from "next/link";
import { formatTimeAgo } from "@/utils/formatTime";
import { getMostRecentTestScoreForUser } from "@/services/testScores.service";
import { getFlashCardsForUser } from "@/services/cards.service";
import { getNotesForUser } from "@/services/note.service";
import { getNotesForUserEditedThisWeek } from "@/services/note.service";
import {
  PageTransition,
  SlideIn,
  FadeIn,
  HoverScale,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/motion";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    return <p className="text-center text-red-500">Error: User not found</p>;
  }

  await checkAndStoreKindeUser();

  const threeMostRecentNotes =
    (await getThreeMostRecentNotesForUser(user.id)) || [];
  const mostRecentTestScore =
    (await getMostRecentTestScoreForUser(user.id)) || [];

  const scorePercentage = mostRecentTestScore[0]
    ? Math.round(Number(mostRecentTestScore[0].testScores.score))
    : null;

  const flashCards = (await getFlashCardsForUser(user.id)) || [];
  const totalFlashCards = flashCards.length;

  const notes = (await getNotesForUser(user.id)) || [];
  const totalNotes = notes.length;

  const notesEditedThisWeek =
    (await getNotesForUserEditedThisWeek(user.id)) || [];
  const totalNotesEditedThisWeek = notesEditedThisWeek.length;

  return (
    <PageTransition>
      <div className="space-y-8">
        <SlideIn direction="down">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Welcome back!</h1>
              <p className="text-muted-foreground">
                Track your study progress and create new content
              </p>
            </div>
            <HoverScale>
              <Link href="/notes/newNote">
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Note
                </Button>
              </Link>
            </HoverScale>
          </div>
        </SlideIn>

        <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <HoverScale scale={1.02}>
              <Link href={`/notes/viewAll/${user.id}`}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Notes
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalNotes}</div>
                    <p className="text-xs text-muted-foreground">
                      +{totalNotesEditedThisWeek} this week
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </HoverScale>
          </StaggerItem>

          <StaggerItem>
            <HoverScale scale={1.02}>
              <Link href={`/flashCards/viewAll/${user.id}`}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Flashcards
                    </CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalFlashCards}</div>
                    <p className="text-xs text-muted-foreground">
                      {totalFlashCards === 0
                        ? "No flashcards yet"
                        : "Across all notes"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </HoverScale>
          </StaggerItem>

          <StaggerItem>
            <HoverScale scale={1.02}>
              <Link href={`quizQuestions/allResults/${user.id}`}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Quiz Score
                    </CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {mostRecentTestScore.length > 0 ? (
                      <>
                        <div className="text-2xl font-bold">
                          {scorePercentage}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last attempt{" "}
                          {formatTimeAgo(
                            mostRecentTestScore[0].testScores.dateAttempted
                          )}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">-</div>
                        <p className="text-xs text-muted-foreground">
                          No attempts yet
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </HoverScale>
          </StaggerItem>

          <StaggerItem>
            <HoverScale scale={1.02}>
              <Link href={`/quizQuestions/allTests/${user.id}`}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Take Quiz
                    </CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Start</div>
                    <p className="text-xs text-muted-foreground">
                      Test your knowledge
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </HoverScale>
          </StaggerItem>
        </StaggerContainer>

        <FadeIn delay={0.3}>
          <div className="space-y-4">
            <SlideIn direction="left">
              <h2 className="text-xl font-semibold">Recent Notes</h2>
            </SlideIn>
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {threeMostRecentNotes.map((i) => (
                <StaggerItem key={i.notes.id}>
                  <HoverScale scale={1.02}>
                    <Link href={`/notes/${i.notes.id}`}>
                      <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                        <CardHeader>
                          <CardTitle className="text-base line-clamp-2">
                            {i.notes.title || "Untitled Note"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                          {`Last edited ${
                            i.notes.lastUpdated
                              ? formatTimeAgo(i.notes.lastUpdated)
                              : "unknown time"
                          }`}
                        </CardContent>
                      </Card>
                    </Link>
                  </HoverScale>
                </StaggerItem>
              ))}

              {threeMostRecentNotes.length === 0 && (
                <StaggerItem>
                  <FadeIn delay={0.5}>
                    <Card className="border-dashed border-2 hover:bg-accent/30 transition-colors">
                      <CardContent className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-muted-foreground">No notes yet</p>
                          <HoverScale>
                            <Link href="/notes/newNote">
                              <Button variant="outline" className="mt-2">
                                Create your first note
                              </Button>
                            </Link>
                          </HoverScale>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeIn>
                </StaggerItem>
              )}
            </StaggerContainer>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
