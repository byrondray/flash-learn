"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { resolveQuizShareToken } from "./actions";
import { Loader2 } from "lucide-react";

export default function QuizSharePage() {
  const { token } = useParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolve() {
      const shareToken = Array.isArray(token) ? token[0] : token;
      if (!shareToken) {
        setError("Invalid share link");
        return;
      }

      const result = await resolveQuizShareToken(shareToken);
      if (result.success) {
        router.replace(`/quizQuestions/test/${result.noteId}`);
      } else {
        setError(result.error);
      }
    }

    resolve();
  }, [token, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-red-500 text-lg font-medium">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-muted-foreground underline"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading quiz...</p>
      </div>
    </div>
  );
}
