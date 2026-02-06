"use client";

import { useReducedMotion } from "@/components/ui/accessibility";

export function useGardenMotion() {
  const prefersReducedMotion = useReducedMotion();

  return {
    fadeIn: prefersReducedMotion
      ? {}
      : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } },
    isReduced: prefersReducedMotion,
  };
}
