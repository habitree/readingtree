"use client";

import { memo, useTransition, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleUserBookPin } from "@/app/actions/books";

interface PinnedBookCardProps {
  userBookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  isPinned?: boolean;
  /** 핀 토글 비활성화 (게스트/샘플) */
  pinDisabled?: boolean;
  priority?: boolean;
}

/**
 * 메인 대시보드의 심플한 책 카드 (8개 그리드용).
 *
 * 표시 요소:
 *   - 책 표지(3:4) + 제목(2줄) + 진행률 바 + 우상단 별 토글
 *
 * 핀 토글:
 *   - 별 클릭 시 toggleUserBookPin 호출.
 *   - 낙관적 갱신: 즉시 UI 반영 후 실패 시 롤백.
 *   - 핀된 책은 정렬상 최상단에 고정됨 (서버 정렬은 reading.ts 가 담당).
 */
export const PinnedBookCard = memo(function PinnedBookCard({
  userBookId,
  title,
  author,
  coverImageUrl,
  currentPage,
  totalPages,
  progressPercent,
  isPinned = false,
  pinDisabled = false,
  priority = false,
}: PinnedBookCardProps) {
  const [pinned, setPinned] = useState(isPinned);
  const [isPending, startTransition] = useTransition();

  const handleTogglePin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pinDisabled || isPending) return;
      const previous = pinned;
      setPinned(!previous);
      startTransition(async () => {
        try {
          const result = await toggleUserBookPin(userBookId);
          setPinned(result.isPinned);
          toast.success(result.isPinned ? "즐겨찾기에 추가했어요." : "즐겨찾기에서 제거했어요.");
        } catch (err) {
          setPinned(previous);
          const msg = err instanceof Error ? err.message : "요청에 실패했어요.";
          toast.error(msg);
        }
      });
    },
    [pinned, pinDisabled, isPending, userBookId],
  );

  return (
    <div className="relative group">
      <Link
        href={`/books/${userBookId}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 rounded-xl"
      >
        <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-forest-300 dark:hover:border-forest-700 hover:shadow-md transition-all">
          {/* 표지 */}
          <div className="relative aspect-[3/4] w-full bg-muted">
            {coverImageUrl ? (
              <Image
                src={coverImageUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover group-hover:scale-[1.02] transition-transform"
                priority={priority}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800/50 dark:to-forest-900/50">
                <BookOpen className="h-8 w-8 text-forest-500/70" />
              </div>
            )}

            {/* 핀 상태 오버레이(좌상단) — 핀된 책에만 표시 */}
            {pinned && (
              <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-sm backdrop-blur-sm">
                <Star className="h-2.5 w-2.5 fill-current" />
              </div>
            )}
          </div>

          {/* 메타 */}
          <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 space-y-1">
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
              {title}
            </h3>
            {author && (
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {author}
              </p>
            )}
            {/* 진행률 바 */}
            <div className="pt-0.5">
              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-forest-400 rounded-full transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[9px] tabular-nums text-slate-400">
                  {currentPage}
                  {totalPages ? `/${totalPages}` : ""}p
                </span>
                <span className="text-[9px] font-medium text-forest-500 tabular-nums">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* 핀 토글 (우상단) */}
      {!pinDisabled && (
        <button
          type="button"
          onClick={handleTogglePin}
          disabled={isPending}
          aria-label={pinned ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          aria-pressed={pinned}
          className={cn(
            "absolute top-1.5 right-1.5 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all",
            "border border-white/60 dark:border-slate-700/60",
            pinned
              ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
              : "bg-white/85 dark:bg-slate-900/85 text-slate-500 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-900",
            // 모바일: 항상 보이게(반투명) / PC: 호버에서 강조
            "opacity-90 sm:opacity-0 sm:group-hover:opacity-100",
            pinned && "opacity-100 sm:opacity-100",
            isPending && "opacity-60 cursor-not-allowed",
          )}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Star className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
          )}
        </button>
      )}
    </div>
  );
});
