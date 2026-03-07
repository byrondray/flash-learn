"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  return !prefersReduced;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const animate = useMotionSafe();
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={animate ? { opacity: 0, y: -20 } : undefined}
      transition={animate ? { duration: 0.3, ease: "easeInOut" } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}

// Container animation for lists/grids
export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const animate = useMotionSafe();
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: animate
            ? { delayChildren: 0.1, staggerChildren: 0.05 }
            : { duration: 0 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Individual item animation for lists
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Slide in animation
export function SlideIn({
  children,
  direction = "left",
  className,
}: {
  children: ReactNode;
  direction?: "left" | "right" | "up" | "down";
  className?: string;
}) {
  const animate = useMotionSafe();
  const variants = {
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    up: { y: -50, opacity: 0 },
    down: { y: 50, opacity: 0 },
  };

  return (
    <motion.div
      className={className}
      initial={animate ? variants[direction] : false}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={animate ? { duration: 0.4, ease: "easeOut" } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}

// Scale animation
export function ScaleIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Button hover animation
export function HoverScale({
  children,
  scale = 1.02,
  className,
}: {
  children: ReactNode;
  scale?: number;
  className?: string;
}) {
  const animate = useMotionSafe();
  return (
    <motion.div
      className={className}
      whileHover={animate ? { scale } : undefined}
      whileTap={animate ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Fade in animation
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

// Modal/Alert animation
export function ModalAnimation({
  children,
  isOpen,
}: {
  children: ReactNode;
  isOpen: boolean;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Enhanced 3D flip with better perspective and styling
export function ThreeDFlip({
  frontContent,
  backContent,
  isFlipped,
  className,
}: {
  frontContent: ReactNode;
  backContent: ReactNode;
  isFlipped: boolean;
  className?: string;
}) {
  return (
    <div className={className} style={{ perspective: "1000px" }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          type: "tween",
        }}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ display: "grid" }}>
          <div
            style={{
              backfaceVisibility: "hidden",
              gridArea: "1 / 1",
            }}
          >
            {frontContent}
          </div>
          <div
            style={{
              backfaceVisibility: "hidden",
              gridArea: "1 / 1",
              transform: "rotateY(180deg)",
            }}
          >
            {backContent}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
