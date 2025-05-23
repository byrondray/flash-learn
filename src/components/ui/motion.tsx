"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// Page transition wrapper
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
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
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: 0.1,
            staggerChildren: 0.05,
          },
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
  const variants = {
    left: { x: -50, opacity: 0 },
    right: { x: 50, opacity: 0 },
    up: { y: -50, opacity: 0 },
    down: { y: 50, opacity: 0 },
  };

  return (
    <motion.div
      className={className}
      initial={variants[direction]}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
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
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
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

// Loading animation
export function LoadingAnimation({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="inline-block"
      >
        <div className="h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
      </motion.div>
    </motion.div>
  );
}

// Progress bar animation
export function AnimatedProgress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`bg-gray-200 rounded-full h-2 ${className}`}
      initial={{ width: 0 }}
      animate={{ width: "100%" }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-blue-600 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />
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

// 3D Flip card animation
export function FlipCard({
  children,
  isFlipped,
  className,
}: {
  children: ReactNode;
  isFlipped: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{
        duration: 0.6,
        ease: "easeInOut",
        type: "tween",
      }}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {children}
    </motion.div>
  );
}

// Front and back faces for flip card
export function FlipCardFace({
  children,
  isFront = true,
  className,
}: {
  children: ReactNode;
  isFront?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      style={{
        backfaceVisibility: "hidden",
        transform: isFront ? "rotateY(0deg)" : "rotateY(180deg)",
        position: isFront ? "relative" : "absolute",
        top: isFront ? "auto" : 0,
        left: isFront ? "auto" : 0,
        right: isFront ? "auto" : 0,
        bottom: isFront ? "auto" : 0,
      }}
    >
      {children}
    </motion.div>
  );
}

// Alternative simpler flip animation using scale and opacity
export function SimpleFlip({
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
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        {!isFlipped ? (
          <motion.div
            key="front"
            initial={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {frontContent}
          </motion.div>
        ) : (
          <motion.div
            key="back"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {backContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
    <div className={`relative ${className}`} style={{ perspective: "1000px" }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.8,
          ease: "easeInOut",
          type: "tween",
        }}
        style={{
          transformStyle: "preserve-3d",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Front face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
        >
          {frontContent}
        </div>

        {/* Back face */}
        <div
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            transform: "rotateY(180deg)",
          }}
        >
          {backContent}
        </div>
      </motion.div>
    </div>
  );
}
