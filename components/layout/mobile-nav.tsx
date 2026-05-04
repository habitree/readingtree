"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, FileText, Plus, Menu, Music2 } from "lucide-react";
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
  action?: "menu" | "note" | "music";
  /** 게스트에게 로그인 유도가 필요한 항목 */
  requiresAuth?: boolean;
  /** FAB 스타일 (중앙 기록 버튼) */
  isFab?: boolean;
}

/**
 * 모바일 네비게이션 아이템 목록 (labelKey 기반)
 * 홈, 서재, +기록(FAB), 타임라인, 더보기
 */
interface MobileNavItemConfig extends Omit<MobileNavItem, 'label'> {
  labelKey: TranslationKey;
}

const mobileNavItemsConfig: MobileNavItemConfig[] = [
  { icon: Home, labelKey: "nav.home", href: "/" },
  { icon: Library, labelKey: "nav.bookshelf", href: "/books" },
  { icon: Plus, labelKey: "nav.writeNote", action: "note", requiresAuth: true, isFab: true },
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
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isOpen, setIsOpen, title, description, requireLogin } = useLoginPrompt();
  const stampCapture = useStampCaptureStore();
  const { session: activeSession, elapsedSeconds } = useReadingSession();
  const openEndSheet = useRecordSheetStore((s) => s.openEnd);
  const openStartSheet = useRecordSheetStore((s) => s.openStart);

  // 이어읽기 책 (공용 훅 — visibilitychange 자동 갱신 포함)
  const { continueBook } = useContinueReading(user ?? null);

  const handleNoteAction = useCallback(() => {
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

    // Phase 5 카나리: 새 RecordSheet 진입 (NEXT_PUBLIC_RECORD_V2=1)
    if (isRecordV2Enabled()) {
      openStartSheet({ book });
      return;
    }

    // Legacy: Stamp Capture
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

            // 중앙 FAB 스타일 기록 버튼
            if (item.isFab) {
              // Phase 4: 진행 중 세션이 있으면 인디케이터로 변형 (탭 → end-step 진입)
              if (activeSession) {
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
                    className="flex-1 min-h-[44px] flex items-center justify-center"
                  >
                    <div className="-mt-3">
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

              return (
                <button
                  key={key}
                  onClick={handleNoteAction}
                  className="flex-1 min-h-[44px] flex items-center justify-center"
                  aria-label={label}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 touch-manipulation">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary text-primary-foreground shadow-md -mt-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] sm:text-xs leading-tight font-medium text-primary">
                      {label}
                    </span>
                  </div>
                </button>
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

