"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

interface MorphingTextProps {
  texts: string[];
  className?: string;
  duration?: number;
}

export default function MorphingText({
  texts,
  className = "",
  duration = 2500,
}: MorphingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const longest = texts.reduce((a, b) => (a.length >= b.length ? a : b), "");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, duration);

    return () => clearInterval(interval);
  }, [texts.length, duration]);

  if (shouldReduceMotion) {
    return <span className={className}>{texts[currentIndex]}</span>;
  }

  return (
    <span
      className={cn(
        "relative inline-block align-bottom text-left whitespace-nowrap",
        className,
      )}
    >
      {/* Invisible sizer reserves the width of the longest word so the
          surrounding line never reflows while words swap */}
      <span className="invisible" aria-hidden="true">
        {longest}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={currentIndex}
          initial={{ opacity: 0, y: "40%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "-40%" }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          {texts[currentIndex]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
