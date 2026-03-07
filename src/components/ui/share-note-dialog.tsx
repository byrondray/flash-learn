"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, X, UserPlus, Copy, Check } from "lucide-react";
import {
  shareNoteWithEmail,
  removeNoteCollaborator,
  fetchNoteCollaborators,
} from "@/app/notes/[id]/actions";

export function ShareNoteDialog(props: {
  noteId: string;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<
    { userId: string; email: string; permission: string; addedAt: string | null }[]
  >([]);

  const loadCollaborators = useCallback(async () => {
    const collabs = await fetchNoteCollaborators(props.noteId);
    setCollaborators(collabs);
  }, [props.noteId]);

  useEffect(() => {
    if (open) {
      loadCollaborators();
    }
  }, [open, loadCollaborators]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setIsSharing(true);
    setError(null);
    setSuccess(null);

    const result = await shareNoteWithEmail(props.noteId, email.trim());
    if (result.success) {
      setSuccess(`Shared with ${email}`);
      setEmail("");
      loadCollaborators();
    } else {
      setError(result.error ?? "Failed to share");
    }

    setIsSharing(false);
  };

  const handleRemove = async (userId: string) => {
    await removeNoteCollaborator(props.noteId, userId);
    loadCollaborators();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!props.isOwner) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleShare();
              }}
              type="email"
            />
            <Button onClick={handleShare} disabled={isSharing || !email.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {success && (
            <p className="text-sm text-green-500">{success}</p>
          )}

          <div className="flex gap-2">
            <Input
              readOnly
              value={typeof window !== "undefined" ? window.location.href : ""}
              className="text-sm text-muted-foreground"
            />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {collaborators.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Collaborators</p>
              {collaborators.map((c) => (
                <div
                  key={c.userId}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="text-sm">
                    <span>{c.email}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({c.permission})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleRemove(c.userId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
