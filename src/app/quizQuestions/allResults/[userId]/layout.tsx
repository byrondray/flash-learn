import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quiz Results",
  description: "View your quiz results and track your learning progress on Flash Learn.",
};

export default function QuizAllResultsLayout(props: {
  children: React.ReactNode;
}) {
  return props.children;
}
