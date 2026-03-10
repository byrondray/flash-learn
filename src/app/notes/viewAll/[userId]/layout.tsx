import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Notes",
  description: "View all your notes on Flash Learn.",
};

export default function NotesViewAllLayout(props: {
  children: React.ReactNode;
}) {
  return props.children;
}
