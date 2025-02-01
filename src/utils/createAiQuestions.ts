import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { FlashCards } from "@/database/schema/flashCards";
import { QuizQuestions } from "@/database/schema/quizQuestions";

const chat = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

function sanitizeContent(content: string): string {
  return content.replace(/[^\w\s.,\-()[\]{}:;?!\/\n]/g, " ").trim();
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
  const parser = new JsonOutputParser();

  const promptTemplate = `Create 5 flashcards from these notes about {title}:

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

  try {
    const sanitizedContent = sanitizeContent(content);
    const result = await chain.invoke({
      title: sanitizeContent(title),
      content: sanitizedContent,
    });
    return result.flashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards");
  }
}

export async function generateQuizQuestions(
  title: string,
  content: string
): Promise<GeneratedQuestion[]> {
  const parser = new JsonOutputParser();
  const promptTemplate =
    'Create 5 multiple choice quiz questions from these notes about {title}:\n\n{content}\n\nReturn a JSON object with a \'questions\' array. Each question should have:\n- question: string (the question text)\n- options: string[] (array of 4 possible answers)\n- correctAnswer: string (the correct answer, must be one of the options)\n- explanation: string (brief explanation of why the answer is correct)\n\nExample format:\n{\n  "questions": [\n    {\n      "question": "What is the primary purpose of async/await in JavaScript?",\n      "options": ["To handle asynchronous operations with cleaner syntax", "To make code run faster", "To create loops", "To define variables"],\n      "correctAnswer": "To handle asynchronous operations with cleaner syntax",\n      "explanation": "async/await provides a more readable and maintainable way to work with Promises and asynchronous code."\n    }\n  ]\n}';

  const prompt = PromptTemplate.fromTemplate(promptTemplate);
  const chain = prompt.pipe(chat).pipe(parser);

  try {
    const sanitizedContent = sanitizeContent(content);
    const result = await chain.invoke({
      title: sanitizeContent(title),
      content: sanitizedContent,
    });
    return result.questions;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function generateUniqueQuestions(
  title: string,
  content: string,
  existingQuestions: QuizQuestions[]
): Promise<GeneratedQuestion[]> {
  const existingQuestionsText = existingQuestions
    .map((q) => sanitizeContent(q.question))
    .join("\n");

  const parser = new JsonOutputParser();
  const promptTemplate =
    'Create 5 new multiple choice quiz questions about {title} that are different from these existing questions:\n\nExisting questions:\n{existingQuestions}\n\nContent to base new questions on:\n{content}\n\nReturn a JSON object with a \'questions\' array. Each question should have:\n- question: string (must be different from existing questions)\n- options: string[] (array of 4 possible answers)\n- correctAnswer: string (must be one of the options)\n- explanation: string (brief explanation of why it\'s correct)\n\nExample format:\n{\n  "questions": [\n    {\n      "question": "What is the difference between let and const in JavaScript?",\n      "options": ["let can be reassigned, const cannot", "let is function-scoped, const is block-scoped", "let is only for numbers, const is for strings", "There is no difference"],\n      "correctAnswer": "let can be reassigned, const cannot",\n      "explanation": "While both let and const are block-scoped, variables declared with let can be reassigned but const variables cannot be reassigned after initialization."\n    }\n  ]\n}';

  const prompt = PromptTemplate.fromTemplate(promptTemplate);
  const chain = prompt.pipe(chat).pipe(parser);

  try {
    const sanitizedContent = sanitizeContent(content);
    const result = await chain.invoke({
      title: sanitizeContent(title),
      content: sanitizedContent,
      existingQuestions: existingQuestionsText,
    });
    return result.questions;
  } catch (error) {
    console.error("Error generating unique questions:", error);
    throw new Error("Failed to generate unique questions");
  }
}
