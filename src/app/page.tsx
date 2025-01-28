import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getThreeMostRecentNotesForUser } from "@/services/note.service";
import { checkAndStoreKindeUser } from "@/utils/checkAndStoreKindeUser";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { BarChart, Clock, BookOpen, Brain } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { getUser } = getKindeServerSession();

  const user = await getUser();

  await checkAndStoreKindeUser();

  const threeMostRecentNotes = await getThreeMostRecentNotesForUser(user!.id);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Track your study progress</p>
        </div>
        <Link href="/notes/newNote">
          <Button>Create New Note</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">147</div>
            <p className="text-xs text-muted-foreground">12 due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.2h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quiz Score</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Last attempt</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Notes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {threeMostRecentNotes.map((i) => (
            <Card
              key={i.notes.id}
              className="cursor-pointer hover:bg-accent/50"
            >
              <CardHeader>
                <CardTitle className="text-base">
                  Note Title {i.notes.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {`Last edited ${i.notes.lastUpdated}`}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
