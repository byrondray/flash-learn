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
    return { title: "Note" };
  }

  const title = result.notes.title || "Note";
  const description = result.notes.content
    ? stripHtml(result.notes.content)
    : "Edit and collaborate on notes with AI-powered tools on Flash Learn.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} – Note`,
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
      title: `${title} – Note`,
      description,
      images: [`/api/og?title=${encodeURIComponent(title)}&type=note`],
    },
  };
}

export default function NoteLayout({ children }: Props) {
  return children;
}
