"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Clock, Plus, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { MobileMenuSheet } from "./mobile-menu-sheet";
import { useMobileNoteSheet } from "@/hooks/use-mobile-note-sheet";
import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { getContinueReadingBooks } from "@/app/actions/books";

/**
 * 모바일 네비게이션 아이템 타입
 */
interface MobileNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  action?: "menu" | "note";
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
  { icon: Clock, labelKey: "nav.timeline", href: "/timeline" },
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
  const noteSheet = useMobileNoteSheet();

  // 이어읽기 책 캐시 (FAB 원탭 진입용)
  const [continueBook, setContinueBook] = useState<{
    id: string;
    bookId: string;
    title: string;
    author: string | null;
    coverImageUrl: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    getContinueReadingBooks(undefined, 1)
      .then((books) => {
        if (books.length > 0) {
          const b = books[0];
          setContinueBook({
            id: b.userBookId,
            bookId: b.bookId,
            title: b.title,
            author: b.author,
            coverImageUrl: b.coverImageUrl,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleNoteAction = useCallback(() => {
    if (!user) {
      requireLogin({
        title: t("nav.writeNoteLoginTitle"),
        description: t("nav.writeNoteLoginDesc"),
      });
      return;
    }
    // 원탭 진입: 이어읽기 책이 있으면 자동 선택 → 바로 입력
    if (continueBook) {
      noteSheet.openWithBook(continueBook);
    } else {
      noteSheet.open();
    }
  }, [user, requireLogin, noteSheet, continueBook]);

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
              return (
                <button
                  key={key}
                  onClick={handleNoteAction}
                  className="flex-1 min-h-[44px] flex items-center justify-center"
                  aria-label={label}
                >
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 touch-manipulation">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary text-primary-foreground shadow-md -mt-3">
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

