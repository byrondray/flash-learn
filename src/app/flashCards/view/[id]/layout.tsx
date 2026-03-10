import type { Metadata } from "next";
import { getNoteById } from "@/services/note.service";
import { stripHtml } from "@/utils/stripHtml";

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getNoteById(id);

  if (!result) {
    return { title: "Flash Cards" };
  }

  const title = result.notes.title || "Flash Cards";
  const description = result.notes.content
    ? stripHtml(result.notes.content)
    : "Study with AI-generated flash cards on Flash Learn.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} – Flash Cards`,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(title)}&type=flashcard`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} – Flash Cards`,
      description,
      images: [`/api/og?title=${encodeURIComponent(title)}&type=flashcard`],
    },
  };
}

export default function FlashCardsViewLayout({ children }: Props) {
  return children;
}
