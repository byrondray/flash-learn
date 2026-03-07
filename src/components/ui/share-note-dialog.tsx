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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, X, UserPlus, Copy, Check } from "lucide-react";
import {
  shareNoteWithEmail,
  removeNoteCollaborator,
  fetchNoteCollaborators,
  getInviteLink,
  updateCollaboratorPermission,
} from "@/app/notes/[id]/actions";

export function ShareNoteDialog(props: {
  noteId: string;
  isOwner: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sharePermission, setSharePermission] = useState<"edit" | "view">("edit");
  const [linkPermission, setLinkPermission] = useState<"edit" | "view">("edit");
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [collaborators, setCollaborators] = useState<
    { userId: string; email: string; permission: string; addedAt: string | null }[]
  >([]);

  const loadCollaborators = useCallback(async () => {
    const collabs = await fetchNoteCollaborators(props.noteId);
    setCollaborators(collabs);
  }, [props.noteId]);

  const loadInviteLink = useCallback(async () => {
    const token = await getInviteLink(props.noteId);
    const origin = window.location.origin;
    setInviteUrl(`${origin}/notes/invite/${token}?permission=${linkPermission}`);
  }, [props.noteId, linkPermission]);

  useEffect(() => {
    if (open) {
      loadCollaborators();
      loadInviteLink();
    }
  }, [open, loadCollaborators, loadInviteLink]);

  const handleShare = async () => {
    if (!email.trim()) return;
    setIsSharing(true);
    setError(null);
    setSuccess(null);

    const result = await shareNoteWithEmail(props.noteId, email.trim(), sharePermission);
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
    await navigator.clipboard.writeText(inviteUrl);
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
              className="flex-1"
            />
            <Select value={sharePermission} onValueChange={(v: "edit" | "view") => setSharePermission(v)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="edit">Edit</SelectItem>
                <SelectItem value="view">View</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-1">
            <p className="text-sm font-medium">Invite link</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteUrl}
                className="text-sm text-muted-foreground flex-1"
              />
              <Select value={linkPermission} onValueChange={(v: "edit" | "view") => setLinkPermission(v)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="view">View</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleCopyLink} disabled={!inviteUrl}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {collaborators.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Collaborators</p>
              {collaborators.map((c) => (
                <div
                  key={c.userId}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <span className="text-sm flex-1">{c.email}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={c.permission}
                      onValueChange={async (v: "edit" | "view") => {
                        await updateCollaboratorPermission(props.noteId, c.userId, v);
                        loadCollaborators();
                      }}
                    >
                      <SelectTrigger className="w-[90px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="edit">Edit</SelectItem>
                        <SelectItem value="view">View</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemove(c.userId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
