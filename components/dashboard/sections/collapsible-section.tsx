"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  storageKey?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * 접이식 섹션 컴포넌트
 * localStorage로 상태를 유지하여 사용자 경험 향상
 */
export function CollapsibleSection({
  title,
  storageKey,
  defaultOpen = false,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  // localStorage에서 상태 복원
  useEffect(() => {
    setMounted(true);
    if (storageKey) {
      const stored = localStorage.getItem(`collapsible-${storageKey}`);
      if (stored !== null) {
        setIsOpen(stored === "true");
      }
    }
  }, [storageKey]);

  // 상태 변경 시 localStorage에 저장
  const toggleOpen = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (storageKey) {
      localStorage.setItem(`collapsible-${storageKey}`, String(newState));
    }
  };

  // 서버 사이드에서는 기본값으로 렌더링
  if (!mounted) {
    return (
      <div className={cn("space-y-3", className)}>
        <button
          className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-full"
          disabled
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              defaultOpen ? "rotate-0" : "-rotate-90"
            )}
          />
          <span>{title}</span>
        </button>
        {defaultOpen && <div className="space-y-4">{children}</div>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <button
        onClick={toggleOpen}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors w-full"
      >
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
        <span>{title}</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 ml-2" />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
