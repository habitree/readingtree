"use client";

import { memo, useTransition, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BookOpen, Star, Loader2, PenLine, X, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toggleUserBookPin, setUserBookHomeHidden } from "@/app/actions/books";
import { useRecordSheetStore } from "@/hooks/use-record-sheet";

interface PinnedBookCardProps {
  /** user_books.id */
  userBookId: string;
  /** books.id (RecordSheet 시작에 필요) */
  bookId: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
  currentPage: number;
  totalPages: number | null;
  progressPercent: number;
  isPinned?: boolean;
  /** 핀 토글 / 기록 시작 비활성화 (게스트/샘플) */
  pinDisabled?: boolean;
  priority?: boolean;
  /**
   * 이 카드의 책에 진행 중 reading_logs 세션이 있는지.
   * true 시 "독서" 버튼이 "멈춤" 모드(다른 색·펄스·Square 아이콘)로 변형되고
   * 클릭 시 세션 종료 시트(openEnd)로 진입한다.
   */
  isReadingActive?: boolean;
  /** 진행 중 세션 ID (isReadingActive=true 일 때 유효) */
  activeSessionId?: string | null;
}

/**
 * 메인 대시보드 8개 그리드 카드.
 *
 * 두 액션 버튼 (사이트 통일 용어 — "기록"·"독서"):
 *   - 기록 (PenLine, 슬레이트 톤) → /notes/new?bookId=<userBookId>
 *     자유 노트(인용·메모·사진·필사) 작성. 텍스트 기반.
 *   - 독서 (BookOpen, forest 톤) → useRecordSheetStore.openStart()
 *     시간 측정 + 페이지 진행 세션 시작.
 *
 *   진행 중 모드 (isReadingActive=true):
 *     - 독서 버튼이 "멈춤"으로 변형 (rose 톤 + 펄스 + Square 아이콘)
 *     - 클릭 시 openEnd(activeSessionId, ...) 로 종료 시트 진입
 *     - 시작/멈춤 두 상태가 한눈에 시각적으로 구분됨
 *
 * 기타:
 *   - 카드 본문(Link) → 책 상세
 *   - 우상단 별 → 즐겨찾기 토글 (낙관)
 *   - 우상단 X (핀 아닌 카드만) → 홈에서 숨기기 (낙관 + Undo 토스트)
 */
export const PinnedBookCard = memo(function PinnedBookCard({
  userBookId,
  bookId,
  title,
  author,
  coverImageUrl,
  currentPage,
  totalPages,
  progressPercent,
  isPinned = false,
  pinDisabled = false,
  priority = false,
  isReadingActive = false,
  activeSessionId = null,
}: PinnedBookCardProps) {
  const router = useRouter();
  const [pinned, setPinned] = useState(isPinned);
  const [hidden, setHidden] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isHiding, startHideTransition] = useTransition();
  const openRecordStart = useRecordSheetStore((s) => s.openStart);
  const openRecordEnd = useRecordSheetStore((s) => s.openEnd);

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

  const handleHideFromHome = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pinDisabled || isHiding) return;
      // 즉시 카드 숨김(낙관) — 사용자에게 빠른 피드백
      setHidden(true);
      startHideTransition(async () => {
        try {
          await setUserBookHomeHidden(userBookId, true);
          toast.success("홈에서 숨겼어요.", {
            description: "서재에서 즐겨찾기를 켜면 다시 표시돼요.",
            action: {
              label: "되돌리기",
              onClick: async () => {
                try {
                  await setUserBookHomeHidden(userBookId, false);
                  setHidden(false);
                  toast.success("다시 표시했어요.");
                } catch {
                  toast.error("되돌리기에 실패했어요.");
                }
              },
            },
          });
        } catch (err) {
          setHidden(false);
          const msg = err instanceof Error ? err.message : "요청에 실패했어요.";
          toast.error(msg);
        }
      });
    },
    [pinDisabled, isHiding, userBookId],
  );

  // "독서" 버튼 — 진행 중 여부에 따라 시작/멈춤으로 분기
  const handleReadingAction = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pinDisabled) return;
      const bookPayload = {
        id: userBookId,
        bookId,
        title,
        author,
        coverImageUrl,
        totalPages,
      };
      if (isReadingActive && activeSessionId) {
        // 멈춤 — 종료 시트 (페이지/메모/사진 입력 후 완료)
        openRecordEnd(activeSessionId, { book: bookPayload });
      } else {
        // 시작 — 시작 시트
        openRecordStart({ book: bookPayload });
      }
    },
    [
      pinDisabled,
      isReadingActive,
      activeSessionId,
      openRecordStart,
      openRecordEnd,
      userBookId,
      bookId,
      title,
      author,
      coverImageUrl,
      totalPages,
    ],
  );

  // "기록" 버튼 — 자유 노트(인용·메모·사진·필사) 작성 페이지로 이동
  const handleOpenNote = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pinDisabled) return;
      router.push(`/notes/new?bookId=${userBookId}`);
    },
    [pinDisabled, router, userBookId],
  );

  const safeProgress = Math.max(0, Math.min(100, progressPercent));

  // 홈에서 숨김 처리된 카드는 렌더링하지 않음 (낙관 업데이트 — 서버 revalidate 전)
  if (hidden) return null;

  return (
    <div className="relative group">
      <Link
        href={`/books/${userBookId}`}
        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
      >
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 hover:border-forest-300 dark:hover:border-forest-700 hover:shadow-md transition-all p-2.5 sm:p-3 space-y-2">
          {/* 상단: 작은 표지 + 제목/저자 */}
          <div className="flex items-start gap-2.5">
            <div className="relative w-12 h-16 sm:w-14 sm:h-[72px] shrink-0 rounded-md overflow-hidden bg-muted shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              {coverImageUrl ? (
                <Image
                  src={coverImageUrl}
                  alt={title}
                  fill
                  sizes="56px"
                  className="object-cover"
                  priority={priority}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200 dark:from-forest-800/50 dark:to-forest-900/50">
                  <BookOpen className="h-4 w-4 text-forest-500/70" />
                </div>
              )}
              {pinned && (
                <div className="absolute -top-0.5 -left-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-amber-900 shadow-sm">
                  <Star className="h-2.5 w-2.5 fill-current" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-7">
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                {title}
              </h3>
              {author && (
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {author}
                </p>
              )}
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[9px] tabular-nums text-slate-400">
                  {currentPage}
                  {totalPages ? `/${totalPages}` : ""}p
                </span>
                <span className="text-[9px] font-semibold text-forest-500 tabular-nums">
                  {safeProgress}%
                </span>
              </div>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-forest-400 rounded-full transition-all"
              style={{ width: `${safeProgress}%` }}
            />
          </div>

          {/* 두 액션 버튼: 기록(텍스트 작성) / 독서(시간 측정) — 균등 분할 */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleOpenNote}
              disabled={pinDisabled}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors",
                "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700",
                pinDisabled && "opacity-50 cursor-not-allowed",
              )}
              aria-label={`${title} 기록 작성`}
            >
              <PenLine className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              기록
            </button>
            {/* 독서 버튼 — 진행 중이면 "멈춤"(rose + 펄스 + Square)으로 변형 */}
            <button
              type="button"
              onClick={handleReadingAction}
              disabled={pinDisabled}
              className={cn(
                "relative inline-flex items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors",
                isReadingActive
                  ? "bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-300 dark:ring-rose-700"
                  : "bg-forest-50 text-forest-700 hover:bg-forest-100 dark:bg-forest-900/30 dark:text-forest-300 dark:hover:bg-forest-900/50",
                pinDisabled && "opacity-50 cursor-not-allowed",
              )}
              aria-label={isReadingActive ? `${title} 독서 멈춤` : `${title} 독서 시작`}
              aria-pressed={isReadingActive}
            >
              {isReadingActive ? (
                <>
                  {/* 진행 중 펄스 인디케이터 */}
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-200" />
                  </span>
                  <Square className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                  멈춤
                </>
              ) : (
                <>
                  <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  독서
                </>
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* 우상단 액션: 핀 토글 + 홈에서 숨기기 (X) */}
      {!pinDisabled && (
        <div className="absolute top-1.5 right-1.5 z-10 flex items-center gap-1">
          {/* 핀 토글 */}
          <button
            type="button"
            onClick={handleTogglePin}
            disabled={isPending}
            aria-label={pinned ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={pinned}
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all",
              "border border-white/60 dark:border-slate-700/60",
              pinned
                ? "bg-amber-400 text-amber-900 hover:bg-amber-300"
                : "bg-white/85 dark:bg-slate-900/85 text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-900",
              "opacity-90 sm:opacity-0 sm:group-hover:opacity-100",
              pinned && "opacity-100 sm:opacity-100",
              isPending && "opacity-60 cursor-not-allowed",
            )}
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Star className={cn("h-3 w-3", pinned && "fill-current")} />
            )}
          </button>

          {/* 홈에서 숨기기 — 핀된 책에는 표시하지 않음(핀이 우선되므로 의미 없음) */}
          {!pinned && (
            <button
              type="button"
              onClick={handleHideFromHome}
              disabled={isHiding}
              aria-label="홈 화면에서 숨기기"
              title="홈 화면에서 숨기기 (서재에는 그대로)"
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-all",
                "border border-white/60 dark:border-slate-700/60",
                "bg-white/85 dark:bg-slate-900/85 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-900",
                "opacity-70 sm:opacity-0 sm:group-hover:opacity-100",
                isHiding && "opacity-60 cursor-not-allowed",
              )}
            >
              {isHiding ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
