"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, BookOpen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed left-4 top-4"
            size="icon"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-4">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block w-[240px] border-r bg-background",
          className
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

function SidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useKindeBrowserClient();

  return (
    <ScrollArea className="h-full py-6">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname === "/" && "bg-secondary"
            )}
            onClick={() => router.push("/")}
          >
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname.includes("/quizQuestions/allTests") && "bg-secondary"
            )}
            onClick={() => router.push(`/quizQuestions/allTest/${user?.id}`)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Quiz Questions
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
