import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { checkAndStoreKindeUser } from "@/utils/checkAndStoreKindeUser";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.flashlearn.ca"),
  title: {
    default: "Flash Learn",
    template: "%s | Flash Learn",
  },
  description:
    "AI-powered note taking app that turns your notes into flash cards and quiz questions for smarter studying.",
  applicationName: "Flash Learn",
  keywords: [
    "flash cards",
    "quiz",
    "AI notes",
    "study tool",
    "note taking",
    "learning",
    "education",
  ],
  authors: [{ name: "Flash Learn" }],
  icons: {
    icon: "/flash-learn-favicon.png",
    apple: "/flash-learn-favicon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Flash Learn",
    title: "Flash Learn",
    description:
      "AI-powered note taking app that turns your notes into flash cards and quiz questions for smarter studying.",
    url: "https://www.flashlearn.ca",
    locale: "en_US",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Flash Learn – AI-Powered Study Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flash Learn",
    description:
      "AI-powered note taking app that turns your notes into flash cards and quiz questions for smarter studying.",
    images: ["/api/og"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await checkAndStoreKindeUser();
  const { isAuthenticated } = getKindeServerSession();
  const isLoggedIn = await isAuthenticated();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {isLoggedIn ? (
          <div className="flex flex-col min-h-screen">
            <div className="flex flex-1">
              <Sidebar className="hidden md:flex" />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </div>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
