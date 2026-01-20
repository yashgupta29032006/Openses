"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
  viewportMargin?: string;
}

export default function FadeIn({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 10,
  className = "",
  viewportMargin = "-50px",
}: FadeInProps) {
  const shouldReduceMotion = useReducedMotion();

  const initial = {
    opacity: 0,
    y: shouldReduceMotion ? 0 : yOffset,
  };

  const animate = {
    opacity: 1,
    y: 0,
  };

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, margin: viewportMargin }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.21, 0.47, 0.32, 0.98], // Custom ease-out
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
