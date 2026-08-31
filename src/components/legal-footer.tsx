import Link from "next/link";
import { cn } from "@/lib/utils";

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "mt-auto border-t py-8 text-center text-sm text-muted-foreground",
        className
      )}
    >
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
