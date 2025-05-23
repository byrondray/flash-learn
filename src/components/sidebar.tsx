"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, BookOpen, Brain, FileText } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlideIn,
  StaggerContainer,
  StaggerItem,
  HoverScale,
  FadeIn,
} from "@/components/ui/motion";
import { useState, useEffect } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <>
      <Sheet>
        {" "}
        <SheetTrigger asChild>
          <HoverScale scale={1.1}>
            <Button
              variant="ghost"
              className="md:hidden fixed left-4 top-4 z-40"
              size="icon"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Menu className="h-4 w-4" />
              </motion.div>
            </Button>
          </HoverScale>
        </SheetTrigger>
        <SheetContent side="left" className="w-[240px] p-4">
          <motion.div
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <SidebarContent />
          </motion.div>
        </SheetContent>
      </Sheet>

      <motion.aside
        className={cn(
          "hidden md:block w-[240px] border-r bg-background",
          className
        )}
        initial={{ x: -240, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}

function SidebarContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useKindeBrowserClient();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Base navigation items that don't require user ID
  const getNavigationItems = (userId?: string) => [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      href: userId ? `/notes/viewAll/${userId}` : "/notes/viewAll/placeholder",
      label: "Notes",
      icon: FileText,
      isActive: pathname.includes("/notes/viewAll"),
      disabled: !userId,
    },
    {
      href: userId
        ? `/quizQuestions/allTests/${userId}`
        : "/quizQuestions/allTests/placeholder",
      label: "Quiz Questions",
      icon: BookOpen,
      isActive: pathname.includes("/quizQuestions/allTests"),
      disabled: !userId,
    },
    {
      href: userId
        ? `/flashCards/viewAll/${userId}`
        : "/flashCards/viewAll/placeholder",
      label: "Flashcards",
      icon: Brain,
      isActive: pathname.includes("/flashCards/viewAll"),
      disabled: !userId,
    },
  ];

  // Use mounted state to prevent hydration mismatch
  const navigationItems = getNavigationItems(mounted ? user?.id : undefined);
  return (
    <ScrollArea className="h-full py-6">
      <div className="px-3 py-2">
        <FadeIn delay={0.2}>
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Flash Learn Logo"
              className="h-16 w-auto"
            />
            <h2 className="mb-2 pr-4 text-xl font-semibold">Flash Learn</h2>
          </div>
        </FadeIn>

        <StaggerContainer className="space-y-1">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <StaggerItem key={item.href}>
                <motion.div layout transition={{ duration: 0.2 }}>
                  <HoverScale scale={1.02}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start transition-all duration-200 relative overflow-hidden",
                        item.isActive && "bg-secondary shadow-sm"
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      {/* Background highlight animation */}
                      <AnimatePresence>
                        {item.isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
                            initial={{ opacity: 0, x: -100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </AnimatePresence>
                      <motion.div
                        className="flex items-center relative z-10"
                        initial={false}
                        animate={{
                          scale: item.isActive ? 1.05 : 1,
                          color: item.isActive
                            ? "hsl(var(--primary))"
                            : "inherit",
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {" "}
                        <motion.div
                          animate={{
                            rotate: item.isActive ? 5 : 0,
                          }}
                          transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                          }}
                          whileHover={{
                            rotate: [0, -5, 5, 0],
                            transition: {
                              duration: 0.6,
                              ease: "easeInOut",
                              times: [0, 0.25, 0.75, 1],
                              type: "tween",
                            },
                          }}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                        </motion.div>
                        {item.label}
                      </motion.div>{" "}
                      {/* Active indicator */}
                    </Button>
                  </HoverScale>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </ScrollArea>
  );
}
