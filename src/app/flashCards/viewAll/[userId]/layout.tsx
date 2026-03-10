import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Flash Cards",
  description: "View all your AI-generated flash card sets on Flash Learn.",
};

export default function FlashCardsViewAllLayout(props: {
  children: React.ReactNode;
}) {
  return props.children;
}
