import Link from "next/link";

export function LegalFooter() {
  return (
    <footer className="border-t py-8 text-center text-sm text-muted-foreground">
      <p>&copy; {new Date().getFullYear()} Flash Learn. All rights reserved.</p>
      <div className="mt-2 flex items-center justify-center gap-4">
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
