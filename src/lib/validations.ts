import { z } from "zod";

export const noteIdSchema = z.string().uuid();

export const shareTokenSchema = z.string().uuid();

export const emailSchema = z.string().email("Invalid email address").max(320);

export const permissionSchema = z.enum(["edit", "view"]);

export const saveNoteSchema = z.object({
  title: z.string().max(500),
  content: z.string().max(100_000),
});

export const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  title: z.string().max(500),
  content: z.string().max(100_000),
});

export const updateNoteTitleSchema = z.object({
  noteId: z.string().uuid(),
  title: z.string().max(500),
});

export const shareNoteSchema = z.object({
  noteId: z.string().uuid(),
  email: emailSchema,
  permission: permissionSchema,
});

export const collaboratorActionSchema = z.object({
  noteId: z.string().uuid(),
  collaboratorUserId: z.string().min(1),
});

export const updateCollaboratorSchema = z.object({
  noteId: z.string().uuid(),
  collaboratorUserId: z.string().min(1),
  permission: permissionSchema,
});

export const flashcardSchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(5000),
});

export const saveFlashCardsSchema = z.object({
  noteId: z.string().uuid(),
  flashcards: z.array(flashcardSchema).min(1).max(20),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1).max(2000),
  options: z.array(z.string().min(1).max(1000)).length(4),
  correctAnswer: z.string().min(1).max(1000),
  explanation: z.string().min(1).max(5000),
});

export const saveQuizQuestionsSchema = z.object({
  noteId: z.string().uuid(),
  questions: z.array(quizQuestionSchema).min(1).max(20),
});

export const saveTestScoreSchema = z.object({
  quizQuestionId: z.string().uuid(),
  score: z.number().min(0).max(100),
});
