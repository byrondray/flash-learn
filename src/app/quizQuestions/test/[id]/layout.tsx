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
    return { title: "Quiz" };
  }

  const title = result.notes.title || "Quiz";
  const description = result.notes.content
    ? stripHtml(result.notes.content)
    : "Test your knowledge with AI-generated quiz questions on Flash Learn.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} – Quiz`,
      description,
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(title)}&type=quiz`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} – Quiz`,
      description,
      images: [`/api/og?title=${encodeURIComponent(title)}&type=quiz`],
    },
  };
}

export default function QuizTestLayout({ children }: Props) {
  return children;
}
