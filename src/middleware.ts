import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/flashCards/share/",
  "/quizQuestions/share/",
  "/notes/invite/",
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return withAuth(req);
}

export const config = {
  matcher: ["/notes/:path*", "/flashCards/:path*", "/quizQuestions/:path*"],
};
