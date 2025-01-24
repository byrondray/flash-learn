import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

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
      <aside className={cn("w-[240px] border-r bg-background", className)}>
        <SidebarContent />
      </aside>
    </>
  );
}

function SidebarContent() {
  return (
    <ScrollArea className="h-full py-6">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
        {/* Add your navigation items here */}
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Settings
          </Button>
          {/* Add more navigation items as needed */}
        </div>
      </div>
    </ScrollArea>
  );
}
