import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { FlashCards } from "@/database/schema/flashCards";
import { QuizQuestions } from "@/database/schema/quizQuestions";

const llm = new OpenAI({
  modelName: "gpt-4-turbo-preview",
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const flashcardTemplate = `Create 5 flashcards from these notes about "{title}":
  
{content}

Return only a JSON array of objects with "front" and "back" properties.`;

const quizTemplate = `Create 5 multiple choice quiz questions from these notes about "{title}":

{content}

Return only a JSON array of objects with properties:
- question: the question text
- options: array of 4 possible answers
- correctAnswer: the correct answer text
- explanation: brief explanation of why it's correct

Make questions challenging but fair.`;

const uniqueQuestionsTemplate = `Create 5 new multiple choice quiz questions about "{title}" that are different from these existing questions:

Existing questions:
{existingQuestions}

Content to base new questions on:
{content}

Return only a JSON array of objects with properties:
- question: the question text (must be different from existing questions)
- options: array of 4 possible answers
- correctAnswer: the correct answer text
- explanation: brief explanation of why it's correct

Make questions challenging but fair, and ensure they're distinct from the existing ones.`;

export async function generateFlashcards(
  title: string,
  content: string
): Promise<FlashCards[]> {
  const parser = new JsonOutputParser();
  const prompt = PromptTemplate.fromTemplate(flashcardTemplate);
  const chain = prompt.pipe(llm).pipe(parser);

  const result = await chain.invoke({ title, content });
  return result.flashcards;
}

export async function generateQuizQuestions(
  title: string,
  content: string
): Promise<QuizQuestions[]> {
  const parser = new JsonOutputParser();
  const prompt = PromptTemplate.fromTemplate(quizTemplate);
  const chain = prompt.pipe(llm).pipe(parser);

  const result = await chain.invoke({ title, content });
  return result.questions;
}

export async function generateUniqueQuestions(
  title: string,
  content: string,
  existingQuestions: QuizQuestions[]
): Promise<QuizQuestions[]> {
  const existingQuestionsText = existingQuestions
    .map((q) => q.question)
    .join("\n");

  const parser = new JsonOutputParser();
  const prompt = PromptTemplate.fromTemplate(uniqueQuestionsTemplate);
  const chain = prompt.pipe(llm).pipe(parser);

  const result = await chain.invoke({
    title,
    content,
    existingQuestions: existingQuestionsText,
  });
  return result.questions;
}

// Example usage:
// const flashcards = await generateFlashcards("Ancient Rome", "Rome was founded in 753 BCE...");
// const quizQuestions = await generateQuizQuestions("Ancient Rome", "Rome was founded in 753 BCE...");
// const newQuestions = await generateUniqueQuestions("Ancient Rome", "Rome was founded in 753 BCE...", existingQuestions);
