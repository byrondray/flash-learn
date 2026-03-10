import type { Metadata } from "next";
import { getNoteByInviteToken } from "@/services/note.service";
import { stripHtml } from "@/utils/stripHtml";
import { InviteClient } from "./client";

type Props = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const result = await getNoteByInviteToken(token);

  if (!result) {
    return { title: "Note Invite" };
  }

  const title = result.notes.title || "Shared Note";
  const description = result.notes.content
    ? stripHtml(result.notes.content)
    : "You've been invited to collaborate on a note in Flash Learn.";

  return {
    title: `Join "${title}"`,
    description,
    openGraph: {
      title: `Join "${title}" – Shared Note`,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(title)}&type=note`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Join "${title}" – Shared Note`,
      description,
      images: [`/api/og?title=${encodeURIComponent(title)}&type=note`],
    },
  };
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  return <InviteClient token={token} />;
}