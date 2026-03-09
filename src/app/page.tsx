import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getThreeMostRecentNotesForUser } from "@/services/note.service";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, BarChart, BookOpen, Brain, Plus, Sparkles, FileText, Zap } from "lucide-react";
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
import Image from "next/image";

export const dynamic = "force-dynamic";

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Flash Learn" width={48} height={48} className="h-12 w-auto" />
          <span className="text-xl font-bold">Flash Learn</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/login">Log in</a>
          </Button>
          <Button asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/register">Sign up</a>
          </Button>
        </div>
      </nav>

      <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground mb-6">
          <Sparkles className="h-4 w-4" />
          AI-powered study tools
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
          Turn your notes into
          <span className="block text-primary">flashcards &amp; quizzes</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Write notes, and let AI instantly generate flashcards and quiz questions.
          Study smarter, retain more, and track your progress — all in one place.
        </p>
        <div className="flex gap-4 mt-8">
          <Button size="lg" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/register">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/login">Log in</a>
          </Button>
        </div>
      </section>

      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-background/60 backdrop-blur">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Rich Note Taking</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Write and organize your notes with a powerful rich-text editor. Collaborate with others in real time.
            </CardContent>
          </Card>

          <Card className="bg-background/60 backdrop-blur">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">AI Flashcards</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Automatically generate flashcards from your notes with one click. Review and master concepts faster.
            </CardContent>
          </Card>

          <Card className="bg-background/60 backdrop-blur">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Smart Quizzes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Test your knowledge with AI-generated quiz questions. Track scores and see your improvement over time.
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Flash Learn. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) {
    return <LandingPage />;
  }

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
                <Card className="cursor-pointer hover:bg-primary/5 transition-colors border-primary/20 border-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Take Quiz
                    </CardTitle>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">Start</div>
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
