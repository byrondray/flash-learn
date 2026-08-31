import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Flash Learn.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          &larr; Back to Flash Learn
        </Link>

        <h1 className="text-3xl font-bold mt-6 mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: August 30, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium">Account information</span> — your name
                and email, via our authentication provider (Kinde).
              </li>
              <li>
                <span className="font-medium">Content you create</span> — notes,
                flashcards, quiz questions, and quiz results.
              </li>
              <li>
                <span className="font-medium">Basic usage data</span> needed to run
                the app, such as when a note was last edited.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How we use it</h2>
            <p>
              We use your data to run the app: storing your notes, generating
              flashcards and quiz questions, tracking your quiz scores, and enabling
              collaboration or sharing features you choose to use. We don&apos;t sell
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. AI processing</h2>
            <p>
              When you generate flashcards or quiz questions, the relevant note
              content is sent to OpenAI to generate that content. Only the content
              needed for generation is sent, and it&apos;s subject to OpenAI&apos;s own
              data handling terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Sharing and collaboration</h2>
            <p>
              If you invite a collaborator to a note, they can view or edit it based
              on the permission you grant. If you generate a public share link for a
              note&apos;s flashcards or quiz, anyone with that link can view that
              content without needing an account.
            </p>
            <p className="mt-3">
              Notes are edited in real time through a separate collaboration server we
              operate. While you have a note open, its full editing state is sent to
              and stored on that server and saved back to your note so your work
              isn&apos;t lost. Anyone else editing the same note at the same time can
              see your cursor position, your account ID, and your display name &mdash;
              which is your first name, or your email address if we don&apos;t have a
              first name for you.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Cookies</h2>
            <p>
              We use cookies set by our authentication provider (Kinde) to keep you
              signed in and to secure your session. These are required for the app to
              work &mdash; we don&apos;t use advertising or third-party tracking
              cookies. Blocking them will prevent you from signing in.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Service providers</h2>
            <p>
              We rely on a small number of third parties to run Flash Learn:
              Kinde (authentication), Turso (database), OpenAI (AI generation), and
              Vercel (hosting). We also operate our own real-time collaboration server
              that handles live note editing. Each processes data only as needed to
              provide their service to us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Data retention &amp; deletion</h2>
            <p>
              We keep your data for as long as your account is active. If you&apos;d
              like your account and associated data deleted, email us at{" "}
              <a
                href="mailto:byron.dray@gmail.com"
                className="font-medium underline underline-offset-4"
              >
                byron.dray@gmail.com
              </a>{" "}
              and we&apos;ll remove it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Changes to this policy</h2>
            <p>
              We may update this policy occasionally. Continued use of the app after
              a change means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
            <p>
              Questions about this policy or your data? Email us at{" "}
              <a
                href="mailto:byron.dray@gmail.com"
                className="font-medium underline underline-offset-4"
              >
                byron.dray@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
