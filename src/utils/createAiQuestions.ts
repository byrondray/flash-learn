import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { QuizQuestions } from "@/database/schema/quizQuestions";
import { unstable_noStore as noStore } from "next/cache";

const chat = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
  timeout: 20000,
  maxRetries: 2,
});

function sanitizeContent(content: string): string {
  return content.replace(/[^\w\s.,\-()[\]{}:;?!\/\n]/g, " ").trim();
}

function splitContentIntoChunks(
  content: string,
  maxChunkSize: number = 2000
): string[] {
  const sentences = content.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

interface GeneratedFlashcard {
  front: string;
  back: string;
}

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export async function generateFlashcards(
  title: string,
  content: string
): Promise<GeneratedFlashcard[]> {
  noStore();
  const parser = new JsonOutputParser();
  const chunks = splitContentIntoChunks(content);
  let allFlashcards: GeneratedFlashcard[] = [];

  for (const chunk of chunks) {
    try {
      const promptTemplate = `Create ${Math.min(
        5,
        Math.ceil(chunk.length / 500)
      )} flashcards from these notes about {title}:

{content}

Return a JSON object with a 'flashcards' array. Each flashcard should have:
- front: string (the question or concept)
- back: string (the explanation or answer)

Example format:
{{ 
  "flashcards": [
    {{ 
      "front": "What is a closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer scope, even after the outer function has returned."
    }}
  ]
}}`;

      const prompt = PromptTemplate.fromTemplate(promptTemplate);
      const chain = prompt.pipe(chat).pipe(parser);

      const sanitizedChunk = sanitizeContent(chunk);
      const result = await chain.invoke({
        title: sanitizeContent(title),
        content: sanitizedChunk,
        "Math.min(5, Math.ceil(chunk.length / 500))": Math.min(
          5,
          Math.ceil(chunk.length / 500)
        ),
      });

      allFlashcards = [...allFlashcards, ...result.flashcards];

      if (allFlashcards.length >= 5) {
        break;
      }
    } catch (error) {
      console.error("Error generating flashcards for chunk:", error);
    }
  }

  return allFlashcards.slice(0, 5);
}

export async function generateQuizQuestions(
  title: string,
  content: string
): Promise<GeneratedQuestion[]> {
  noStore();
  const parser = new JsonOutputParser();
  const chunks = splitContentIntoChunks(content);
  let allQuestions: GeneratedQuestion[] = [];

  for (const chunk of chunks) {
    try {
      const promptTemplate =
        'Create ${Math.min(5, Math.ceil(chunk.length / 500))} multiple choice quiz questions from these notes about {title}:\n\n{content}\n\nReturn a JSON object with a \'questions\' array. Each question should have:\n- question: string (the question text)\n- options: string[] (array of 4 possible answers)\n- correctAnswer: string (the correct answer, must be one of the options)\n- explanation: string (brief explanation of why the answer is correct)\n\nExample format:\n{\n  "questions": [\n    {\n      "question": "What is the primary purpose of async/await in JavaScript?",\n      "options": ["To handle asynchronous operations with cleaner syntax", "To make code run faster", "To create loops", "To define variables"],\n      "correctAnswer": "To handle asynchronous operations with cleaner syntax",\n      "explanation": "async/await provides a more readable and maintainable way to work with Promises and asynchronous code."\n    }\n  ]\n}';

      const prompt = PromptTemplate.fromTemplate(promptTemplate);
      const chain = prompt.pipe(chat).pipe(parser);

      const sanitizedChunk = sanitizeContent(chunk);
      const result = await chain.invoke({
        title: sanitizeContent(title),
        content: sanitizedChunk,
        "Math.min(5, Math.ceil(chunk.length / 500))": Math.min(
          5,
          Math.ceil(chunk.length / 500)
        ),
      });

      allQuestions = [...allQuestions, ...result.questions];

      if (allQuestions.length >= 5) {
        break;
      }
    } catch (error) {
      console.error("Error generating quiz questions for chunk:", error);
    }
  }

  return allQuestions.slice(0, 5);
}

export async function generateUniqueQuestions(
  title: string,
  content: string,
  existingQuestions: QuizQuestions[]
): Promise<GeneratedQuestion[]> {
  noStore();
  const existingQuestionsText = existingQuestions
    .map((q) => sanitizeContent(q.question))
    .join("\n");

  const parser = new JsonOutputParser();
  const chunks = splitContentIntoChunks(content);
  let allQuestions: GeneratedQuestion[] = [];

  for (const chunk of chunks) {
    try {
      const promptTemplate =
        'Create ${Math.min(5, Math.ceil(chunk.length / 500))} new multiple choice quiz questions about {title} that are different from these existing questions:\n\nExisting questions:\n{existingQuestions}\n\nContent to base new questions on:\n{content}\n\nReturn a JSON object with a \'questions\' array. Each question should have:\n- question: string (must be different from existing questions)\n- options: string[] (array of 4 possible answers)\n- correctAnswer: string (must be one of the options)\n- explanation: string (brief explanation of why it\'s correct)\n\nExample format:\n{{\n  "questions": [\n    {{\n      "question": "What is the difference between let and const in JavaScript?",\n      "options": ["let can be reassigned, const cannot", "let is function-scoped, const is block-scoped", "let is only for numbers, const is for strings", "There is no difference"],\n      "correctAnswer": "let can be reassigned, const cannot",\n      "explanation": "While both let and const are block-scoped, variables declared with let can be reassigned but const variables cannot be reassigned after initialization."\n    }}\n  ]\n}}';

      const prompt = PromptTemplate.fromTemplate(promptTemplate);
      const chain = prompt.pipe(chat).pipe(parser);

      const sanitizedChunk = sanitizeContent(chunk);
      const result = await chain.invoke({
        title: sanitizeContent(title),
        content: sanitizedChunk,
        existingQuestions: existingQuestionsText,
        "Math.min(5, Math.ceil(chunk.length / 500))": Math.min(
          5,
          Math.ceil(chunk.length / 500)
        ),
      });

      allQuestions = [...allQuestions, ...result.questions];

      if (allQuestions.length >= 5) {
        break;
      }
    } catch (error) {
      console.error("Error generating unique questions for chunk:", error);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error("Failed to generate any valid questions");
  }

  return allQuestions.slice(0, 5);
}
