"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Library, FileText, Menu, Music2, PenLine, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { useStampCaptureStore } from "@/hooks/use-stamp-capture";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { useContinueReading } from "@/hooks/use-continue-reading";
import { useReadingSession } from "@/hooks/use-reading-session";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { RecordActivePill } from "@/components/records/record-active-pill";
import { isRecordV2Enabled } from "@/lib/feature-flags";

/**
 * 모바일 네비게이션 아이템 타입
 */
interface MobileNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  /**
   * action 종류:
   *   - menu/music: 시트 진입
   *   - recordPair: "기록 / 독서" 한 칸 안에 두 미니 버튼 (사용자 요구로 분리)
   */
  action?: "menu" | "music" | "recordPair";
  /** 게스트에게 로그인 유도가 필요한 항목 */
  requiresAuth?: boolean;
}

/**
 * 모바일 네비게이션 아이템 목록 (labelKey 기반)
 * 홈, 서재, [기록|독서] 페어, 노트, 음악, 더보기
 */
interface MobileNavItemConfig extends Omit<MobileNavItem, 'label'> {
  labelKey: TranslationKey;
}

const mobileNavItemsConfig: MobileNavItemConfig[] = [
  { icon: Home, labelKey: "nav.home", href: "/" },
  { icon: Library, labelKey: "nav.bookshelf", href: "/books" },
  // 가운데 한 칸 — 두 미니 FAB(기록 / 독서) 페어로 렌더링
  { icon: PenLine, labelKey: "nav.writeNote", action: "recordPair", requiresAuth: true },
  { icon: FileText, labelKey: "notes.myNotes", href: "/notes" },
  { icon: Music2, labelKey: "nav.more", action: "music" },
  { icon: Menu, labelKey: "nav.more", action: "menu" },
];

/**
 * 모바일 하단 네비게이션 컴포넌트
 * 모바일에서만 표시되는 하단 고정 네비게이션
 */
export function MobileNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOpen, setIsOpen, title, description, requireLogin } = useLoginPrompt();
  const stampCapture = useStampCaptureStore();
  const { session: activeSession, elapsedSeconds } = useReadingSession();
  const openEndSheet = useRecordSheetStore((s) => s.openEnd);
  const openStartSheet = useRecordSheetStore((s) => s.openStart);

  // 이어읽기 책 (공용 훅 — visibilitychange 자동 갱신 포함)
  const { continueBook } = useContinueReading(user ?? null);

  // "기록" — 자유 노트(인용·메모·사진·필사) 작성 페이지로 이동
  const handleNoteWrite = useCallback(() => {
    if (!user) {
      requireLogin({
        title: t("nav.writeNoteLoginTitle"),
        description: t("nav.writeNoteLoginDesc"),
      });
      return;
    }
    const bookId = continueBook?.id;
    router.push(bookId ? `/notes/new?bookId=${bookId}` : "/notes/new");
  }, [user, requireLogin, t, router, continueBook]);

  // "독서" — 시간 측정 세션 시작 (진행 중 처리는 RecordActivePill 분기에서)
  const handleReadingStart = useCallback(() => {
    if (!user) {
      requireLogin({
        title: t("nav.writeNoteLoginTitle"),
        description: t("nav.writeNoteLoginDesc"),
      });
      return;
    }
    const book: RecordSheetBook | null = continueBook
      ? {
          id: continueBook.id,
          bookId: continueBook.bookId,
          title: continueBook.title,
          author: continueBook.author,
          coverImageUrl: continueBook.coverImageUrl,
          totalPages: null,
        }
      : null;

    if (isRecordV2Enabled()) {
      openStartSheet({ book });
      return;
    }

    // Legacy fallback
    if (book) {
      stampCapture.openWithBook(book);
    } else {
      stampCapture.open();
    }
  }, [user, requireLogin, stampCapture, openStartSheet, continueBook, t]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg lg:hidden"
        aria-label={t("nav.mobileNav")}
      >
        <div className="flex items-center justify-around h-14 sm:h-16 safe-area-inset-bottom" role="list">
          {mobileNavItemsConfig.map((item, index) => {
            const Icon = item.icon;
            const label = t(item.labelKey);
            const isActive = item.href
              ? pathname === item.href || pathname.startsWith(item.href + "/")
              : false;
            const key = item.href || `action-${item.action}-${index}`;

            // 음악 버튼 (단순화 — 음악 시트만 열기)
            if (item.action === "music") {
              const isPlaying = useMusicPlayer.getState().isPlaying;
              return (
                <button
                  key={key}
                  onClick={() => useMusicPlayer.getState().openMusicSheet()}
                  className="flex-1 min-h-[44px]"
                  aria-label="음악"
                >
                  <div
                    className={cn(
                      "w-full flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1 rounded-none touch-manipulation",
                      isPlaying
                        ? "text-primary"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isPlaying && "text-primary animate-pulse")} aria-hidden="true" />
                    <span className={cn("text-[10px] sm:text-xs leading-tight", isPlaying && "text-primary font-medium")}>
                      음악
                    </span>
                  </div>
                </button>
              );
            }

            // 더보기 메뉴 버튼
            if (item.action === "menu") {
              return (
                <button
                  key={key}
                  onClick={() => setIsMenuOpen(true)}
                  className="flex-1 min-h-[44px]"
                  aria-label={label}
                >
                  <div
                    className={cn(
                      "w-full flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1 rounded-none touch-manipulation",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    <span className="text-[10px] sm:text-xs leading-tight">
                      {label}
                    </span>
                  </div>
                </button>
              );
            }

            // 중앙 페어 — "기록"(노트) + "독서"(세션) 두 미니 FAB.
            // 진행 중에는 "독서" 자리가 RecordActivePill 로 변형됨.
            if (item.action === "recordPair") {
              if (activeSession) {
                // 진행 중: "기록"(작은) + "Pill"(독서 멈춤 인디케이터)
                const book: RecordSheetBook | null = activeSession.book
                  ? {
                      id: activeSession.user_book_id,
                      bookId: activeSession.book.id,
                      title: activeSession.book.title,
                      author: activeSession.book.author,
                      coverImageUrl: activeSession.book.cover_image_url,
                      totalPages: activeSession.book.total_pages,
                    }
                  : null;
                return (
                  <div
                    key={key}
                    className="flex-1 min-h-[44px] flex items-center justify-center gap-1"
                  >
                    <button
                      onClick={handleNoteWrite}
                      className="flex flex-col items-center gap-0.5 touch-manipulation"
                      aria-label="기록 작성"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm">
                        <PenLine className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] leading-none font-medium text-slate-600 dark:text-slate-400">
                        기록
                      </span>
                    </button>
                    <div className="-mt-2">
                      <RecordActivePill
                        elapsedSeconds={elapsedSeconds}
                        bookTitle={activeSession.book?.title}
                        coverImageUrl={activeSession.book?.cover_image_url}
                        variant="fab"
                        onClick={() => openEndSheet(activeSession.id, { book })}
                      />
                    </div>
                  </div>
                );
              }

              // 비진행: "기록"(슬레이트) + "독서"(forest) 두 미니 FAB
              return (
                <div
                  key={key}
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <button
                    onClick={handleNoteWrite}
                    className="flex flex-col items-center gap-0.5 touch-manipulation"
                    aria-label="기록 작성"
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-sm hover:bg-slate-300 dark:hover:bg-slate-700">
                      <PenLine className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] leading-none font-medium text-slate-600 dark:text-slate-400">
                      기록
                    </span>
                  </button>
                  <button
                    onClick={handleReadingStart}
                    className="flex flex-col items-center gap-0.5 touch-manipulation"
                    aria-label="독서 시작"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-forest-600 text-white shadow-md hover:bg-forest-700 -mt-2">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] leading-none font-semibold text-forest-700 dark:text-forest-400">
                      독서
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <Link
                key={key}
                href={item.href!}
                className="flex-1 min-h-[44px]"
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1 rounded-none touch-manipulation",
                    isActive && "text-primary bg-secondary/50"
                  )}
                  aria-label={label}
                  aria-pressed={isActive}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isActive && "text-primary")} aria-hidden="true" />
                  <span className={cn("text-[10px] sm:text-xs leading-tight", isActive && "text-primary font-medium")}>
                    {label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 더보기 메뉴 바텀시트 */}
      <MobileMenuSheet open={isMenuOpen} onOpenChange={setIsMenuOpen} />

      {/* 로그인 유도 모달 */}
      <LoginPromptModal open={isOpen} onOpenChange={setIsOpen} title={title} description={description} />
    </>
  );
}

