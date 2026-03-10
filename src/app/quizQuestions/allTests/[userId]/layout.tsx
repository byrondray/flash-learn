import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Quizzes",
  description: "View all your AI-generated quizzes on Flash Learn.",
};

export default function QuizAllTestsLayout(props: {
  children: React.ReactNode;
}) {
  return props.children;
}
