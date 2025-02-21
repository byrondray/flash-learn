import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { QuizQuestions } from "@/database/schema/quizQuestions";
import { unstable_noStore as noStore } from "next/cache";

const chat = new ChatOpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
  streaming: false,
});

function sanitizeContent(content: string): string {
  return content.replace(/[^\w\s.,\-()[\]{}:;?!\/\n]/g, " ").trim();
}

function splitContentIntoChunks(
  content: string,
  maxChunkSize: number = 1500
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

async function processChunkWithTimeout<T>(
  processor: () => Promise<T>,
  timeoutMs: number = 25000
): Promise<T> {
  return Promise.race([
    processor(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Processing timeout")), timeoutMs)
    ),
  ]);
}

async function createPromptChain(
  templateString: string,
  parser: JsonOutputParser,
  inputVariables: string[]
) {
  const prompt = new PromptTemplate({
    template: templateString,
    inputVariables,
  });

  return prompt.pipe(chat).pipe(parser);
}

export async function generateFlashcards(
  title: string,
  content: string
): Promise<GeneratedFlashcard[]> {
  noStore();
  console.log("Starting flashcard generation for:", title);

  const parser = new JsonOutputParser();
  const chunks = splitContentIntoChunks(content);
  let allFlashcards: GeneratedFlashcard[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const numCards = Math.min(5, Math.ceil(chunk.length / 500));
      const templateString = `Create {numCards} flashcards from these notes about {title}:

{content}

Return a JSON object with a 'flashcards' array. Each flashcard should have:
- front: string (the question or concept)
- back: string (the explanation or answer)

Example format:
{
  "flashcards": [
    {
      "front": "What is a closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer scope, even after the outer function has returned."
    }
  ]
}`;

      const chain = await createPromptChain(templateString, parser, [
        "title",
        "content",
        "numCards",
      ]);
      const result = await processChunkWithTimeout(async () => {
        return chain.invoke({
          title: sanitizeContent(title),
          content: sanitizeContent(chunk),
          numCards,
        });
      });

      allFlashcards = [...allFlashcards, ...result.flashcards];
      console.log(
        `Generated ${result.flashcards.length} flashcards from chunk ${i + 1}`
      );

      if (allFlashcards.length >= 5) {
        console.log("Reached target number of flashcards");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
    }
  }

  if (allFlashcards.length === 0) {
    throw new Error("Failed to generate any flashcards");
  }

  return allFlashcards.slice(0, 5);
}

export async function generateQuizQuestions(
  title: string,
  content: string
): Promise<GeneratedQuestion[]> {
  noStore();
  console.log("Starting quiz question generation for:", title);

  const parser = new JsonOutputParser();
  const chunks = splitContentIntoChunks(content);
  let allQuestions: GeneratedQuestion[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const numQuestions = Math.min(5, Math.ceil(chunk.length / 500));
      const templateString = `Create {numQuestions} multiple choice quiz questions from these notes about {title}:

{content}

Return a JSON object with a 'questions' array. Each question should have:
- question: string (the question text)
- options: string[] (array of 4 possible answers)
- correctAnswer: string (the correct answer, must be one of the options)
- explanation: string (brief explanation of why the answer is correct)

Example format:
{
  "questions": [
    {
      "question": "What is the primary purpose of async/await in JavaScript?",
      "options": ["To handle asynchronous operations with cleaner syntax", "To make code run faster", "To create loops", "To define variables"],
      "correctAnswer": "To handle asynchronous operations with cleaner syntax",
      "explanation": "async/await provides a more readable and maintainable way to work with Promises and asynchronous code."
    }
  ]
}`;

      const chain = await createPromptChain(templateString, parser, [
        "title",
        "content",
        "numQuestions",
      ]);
      const result = await processChunkWithTimeout(async () => {
        return chain.invoke({
          title: sanitizeContent(title),
          content: sanitizeContent(chunk),
          numQuestions,
        });
      });

      allQuestions = [...allQuestions, ...result.questions];
      console.log(
        `Generated ${result.questions.length} questions from chunk ${i + 1}`
      );

      if (allQuestions.length >= 5) {
        console.log("Reached target number of questions");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error("Failed to generate any questions");
  }

  return allQuestions.slice(0, 5);
}

export async function generateUniqueQuestions(
  title: string,
  content: string,
  existingQuestions: QuizQuestions[]
): Promise<GeneratedQuestion[]> {
  noStore();
  console.log("Starting unique question generation for:", title);

  const existingQuestionsText = existingQuestions
    .map((q) => sanitizeContent(q.question))
    .join("\n");

  const parser = new JsonOutputParser();
  const chunks = splitContentIntoChunks(content);
  let allQuestions: GeneratedQuestion[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      console.log(`Processing chunk ${i + 1}/${chunks.length}`);

      const numQuestions = Math.min(5, Math.ceil(chunk.length / 500));
      const templateString = `Create {numQuestions} new multiple choice quiz questions about {title} that are different from these existing questions:

Existing questions:
{existingQuestions}

Content to base new questions on:
{content}

Return a JSON object with a 'questions' array. Each question should have:
- question: string (must be different from existing questions)
- options: string[] (array of 4 possible answers)
- correctAnswer: string (must be one of the options)
- explanation: string (brief explanation of why it's correct)

Example format:
{
  "questions": [
    {
      "question": "What is the difference between let and const in JavaScript?",
      "options": ["let can be reassigned, const cannot", "let is function-scoped, const is block-scoped", "let is only for numbers, const is for strings", "There is no difference"],
      "correctAnswer": "let can be reassigned, const cannot",
      "explanation": "While both let and const are block-scoped, variables declared with let can be reassigned but const variables cannot be reassigned after initialization."
    }
  ]
}`;

      const chain = await createPromptChain(templateString, parser, [
        "title",
        "content",
        "numQuestions",
        "existingQuestions",
      ]);
      const result = await processChunkWithTimeout(async () => {
        return chain.invoke({
          title: sanitizeContent(title),
          content: sanitizeContent(chunk),
          existingQuestions: existingQuestionsText,
          numQuestions,
        });
      });

      allQuestions = [...allQuestions, ...result.questions];
      console.log(
        `Generated ${result.questions.length} questions from chunk ${i + 1}`
      );

      if (allQuestions.length >= 5) {
        console.log("Reached target number of questions");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing chunk ${i + 1}:`, error);
    }
  }

  if (allQuestions.length === 0) {
    throw new Error("Failed to generate any valid questions");
  }

  return allQuestions.slice(0, 5);
}
