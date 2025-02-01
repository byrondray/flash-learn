"use server";

import { getNoteById } from "@/services/note.service";
import {
  createQuizQuestion,
  getQuizQuestionsForNoteId,
} from "@/services/questions.service";
import { generateUniqueQuestions } from "@/utils/createAiQuestions";

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateQuizQuestionsAction(
  noteId: string
): Promise<GeneratedQuestion[]> {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new Error("Note not found");
  }

  const existingQuizQuestions = await getQuizQuestionsForNoteId(noteId);
  return await generateUniqueQuestions(
    note.notes.title,
    note.notes.content,
    existingQuizQuestions
  );
}

export async function saveQuizQuestions(
  noteId: string,
  questions: GeneratedQuestion[]
) {
  try {
    const savedQuestions = await Promise.all(
      questions.map((question) =>
        createQuizQuestion(
          noteId,
          question.question,
          question.options,
          question.correctAnswer,
          question.explanation
        )
      )
    );
    return savedQuestions;
  } catch (error) {
    console.error("Error saving quiz questions:", error);
    throw error;
  }
}
