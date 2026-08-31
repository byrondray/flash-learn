import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Flash Learn.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          &larr; Back to Flash Learn
        </Link>

        <h1 className="text-3xl font-bold mt-6 mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Last updated: August 30, 2026
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of terms</h2>
            <p>
              By creating an account or using Flash Learn (&quot;the app&quot;), you
              agree to these Terms of Service. If you don&apos;t agree, please don&apos;t
              use the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. What Flash Learn does</h2>
            <p>
              Flash Learn lets you write notes and uses AI to generate flashcards and
              quiz questions from that content. Notes can optionally be shared with
              collaborators or made accessible via a public link.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Your content</h2>
            <p>
              You retain ownership of the notes and content you create. You&apos;re
              responsible for what you write and share, including anything you invite
              collaborators to view or edit, or make available through a public share
              link. Don&apos;t upload content you don&apos;t have the right to share.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. AI-generated content</h2>
            <p>
              Flashcards and quiz questions are generated automatically by an AI
              model and may contain inaccuracies. They&apos;re a study aid, not a
              guaranteed-correct source — always double-check important information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Acceptable use</h2>
            <p>
              Don&apos;t use Flash Learn to store or distribute illegal content, attempt
              to disrupt the service, or access accounts or notes that aren&apos;t
              yours without permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Availability</h2>
            <p>
              Flash Learn is provided on an &quot;as is&quot; basis with no uptime
              guarantee. Features, including AI generation, may change or be
              unavailable from time to time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Limitation of liability</h2>
            <p>
              Flash Learn is provided without warranties of any kind. To the extent
              permitted by law, we&apos;re not liable for any damages arising from your
              use of the app, including loss of data or reliance on AI-generated
              content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the app
              after a change means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
            <p>
              Questions about these terms? Email us at{" "}
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
