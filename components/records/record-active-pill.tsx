"use client";

/**
 * 진행 중 세션 인디케이터 (Active Pill)
 *
 * Phase 4 active-session-indicator.tsx에서 FAB·헤더 양쪽에서 사용하는 공유 위젯.
 * 본 컴포넌트는 순수 표시 — 데이터 fetching·구독은 useReadingSession이 담당.
 */

import Image from "next/image";
import { Book } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  elapsedSeconds: number;
  bookTitle?: string | null;
  coverImageUrl?: string | null;
  /** 종료 페이지를 입력하지 않은 시점에서의 예상 종료 시각이 임박했는지 (warning) */
  warning?: boolean;
  variant?: "fab" | "pill";
  onClick?: () => void;
  className?: string;
}

export function RecordActivePill({
  elapsedSeconds,
  bookTitle,
  coverImageUrl,
  warning,
  variant = "pill",
  onClick,
  className,
}: Props) {
  const time = formatElapsed(elapsedSeconds);

  if (variant === "fab") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex h-14 w-14 flex-col items-center justify-center rounded-full shadow-lg transition-all",
          "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95",
          warning && "bg-amber-500 hover:bg-amber-600",
          className,
        )}
        aria-label={`독서 기록 진행 중, ${time}`}
        aria-live="polite"
      >
        {coverImageUrl ? (
          <div className="relative h-7 w-7 overflow-hidden rounded-sm border border-white/40">
            <Image src={coverImageUrl} alt="" fill sizes="28px" className="object-cover" />
          </div>
        ) : (
          <Book className="h-5 w-5" />
        )}
        <span className="mt-0.5 text-[10px] font-semibold tabular-nums">{time}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300",
        warning && "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300",
        className,
      )}
      aria-label={`독서 기록 진행 중, ${time}`}
      aria-live="polite"
    >
      {coverImageUrl ? (
        <div className="relative h-5 w-5 overflow-hidden rounded">
          <Image src={coverImageUrl} alt="" fill sizes="20px" className="object-cover" />
        </div>
      ) : (
        <Book className="h-4 w-4" />
      )}
      <span className="tabular-nums">{time}</span>
      {bookTitle && (
        <span className="hidden max-w-[140px] truncate text-xs font-normal opacity-80 sm:inline">
          · {bookTitle}
        </span>
      )}
    </button>
  );
}

function formatElapsed(totalSec: number): string {
  if (totalSec < 0) totalSec = 0;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
