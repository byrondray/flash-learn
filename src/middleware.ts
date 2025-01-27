import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default function middleware(req: Request) {
  return withAuth(req);
}

export const config = {
  matcher: [
    "/",
    "/notes/newNote",
    "/notes/[id]",
    "/flashCards/create/[id]",
    "/quizQuestions/create/[id]",
    "/quizQuestions/[id]",
  ],
};
