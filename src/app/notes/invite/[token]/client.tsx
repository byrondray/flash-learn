"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "./actions";
import { Loader2 } from "lucide-react";

export function InviteClient(props: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleInvite() {
      // The invite's permission is decided server-side (by whatever the
      // owner set when generating the link), not by the client.
      const result = await acceptInvite(props.token);
      if (result.success && result.noteId) {
        router.replace(`/notes/${result.noteId}`);
      } else {
        setError(result.error ?? "Failed to join note");
      }
    }

    handleInvite();
  }, [props.token, router]);

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
        <p className="text-sm text-muted-foreground">Joining note...</p>
      </div>
    </div>
  );
}
