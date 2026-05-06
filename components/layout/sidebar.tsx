"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Library,
  Users,
  User,
  Trees,
  Bot,
  Sparkles,
  StickyNote,
  PenLine,
  FileText,
  Coins,
  Lightbulb,
  Stamp,
  BookOpen,
  Square,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { BookshelfTree } from "./bookshelf-tree";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { useQuickCaptureStore } from "@/hooks/use-quick-capture";
import { useStampCaptureStore } from "@/hooks/use-stamp-capture";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { useReadingSession } from "@/hooks/use-reading-session";
import { isRecordV2Enabled } from "@/lib/feature-flags";
import { useContinueReading } from "@/hooks/use-continue-reading";

/**
 * 사이드바 네비게이션 아이템 타입
 *
 * action 종류:
 *   - quickCapture: legacy 빠른 캡처 진입
 *   - stampCapture: legacy 스탬프 시트(현재 미사용 — readingStart 로 대체)
 *   - noteWrite:    "기록" — 자유 노트(인용·메모·사진·필사) 작성 페이지로 이동
 *   - readingStart: "독서" — 시간 측정 세션 시작/멈춤 (진행 중 자동 변형)
 */
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href?: string;
  action?: "quickCapture" | "stampCapture" | "noteWrite" | "readingStart";
  badge?: number;
  adminOnly?: boolean;
}

/**
 * 사이드바 컴포넌트
 * 데스크톱에서 고정 사이드바로 표시
 * 핵심 5개 메뉴 + 더보기 접이식 그룹
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const primaryItems: SidebarItem[] = [
    { icon: Home, label: t("nav.home"), href: "/" },
    { icon: Library, label: t("nav.myLibrary"), href: "/books" },
    // "기록" / "독서" 분리 — 메인 카드 정책과 동일한 두 액션
    { icon: PenLine, label: "기록", action: "noteWrite" },
    { icon: BookOpen, label: "독서", action: "readingStart" },
    { icon: FileText, label: t("notes.myNotes"), href: "/notes" },
    { icon: User, label: t("nav.profile"), href: "/profile" },
  ];

  const secondaryItems: SidebarItem[] = [
    { icon: Stamp, label: t("stamp.collection"), href: "/stamps" },
    { icon: Users, label: t("nav.groups"), href: "/groups" },
    { icon: Sparkles, label: t("persona.pageTitle"), href: "/stats" },
    { icon: Bot, label: t("nav.aiChat"), href: "/chat" },
    { icon: Coins, label: t("nav.points"), href: "/points" },
    { icon: Lightbulb, label: t("nav.featureRequests"), href: "/feature-requests" },
    { icon: Trees, label: t("nav.admin"), href: "/admin", adminOnly: true },
  ];
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isAdmin = profile?.is_admin === true;

  // 더보기 영역의 항목이 활성화되어 있으면 자동으로 열기
  useEffect(() => {
    const isSecondaryActive = secondaryItems.some(
      (item) => item.href && (pathname === item.href || pathname.startsWith(item.href + "/"))
    );
    if (isSecondaryActive) {
      setIsMoreOpen(true);
    }
  }, [pathname]);

  const router = useRouter();
  const openQuickCapture = useQuickCaptureStore((s) => s.open);
  const openWithBook = useQuickCaptureStore((s) => s.openWithBook);
  const openStampCapture = useStampCaptureStore((s) => s.open);
  const openStampWithBook = useStampCaptureStore((s) => s.openWithBook);
  const openRecordStart = useRecordSheetStore((s) => s.openStart);
  const openRecordEnd = useRecordSheetStore((s) => s.openEnd);

  // 진행 중 세션 — "독서" 항목이 "멈춤"으로 변형되는 트리거
  const { session: activeSession } = useReadingSession();

  // 이어읽기 책 (공용 훅 — visibilitychange 자동 갱신 포함)
  const { continueBook } = useContinueReading(user ?? null);

  const handleQuickCapture = useCallback(() => {
    if (continueBook) {
      openWithBook(continueBook);
    } else {
      openQuickCapture();
    }
  }, [continueBook, openWithBook, openQuickCapture]);

  const handleStampCapture = useCallback(() => {
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

    // Phase 5 카나리: V2 ON이면 새 RecordSheet, OFF면 기존 StampCaptureSheet
    if (isRecordV2Enabled()) {
      openRecordStart({ book });
      return;
    }

    if (book) {
      openStampWithBook(book);
    } else {
      openStampCapture();
    }
  }, [continueBook, openStampWithBook, openStampCapture, openRecordStart]);

  // "기록" 항목 — 자유 노트(인용·메모·사진·필사) 작성 페이지로 이동
  const handleNoteWrite = useCallback(() => {
    const bookId = continueBook?.id;
    router.push(bookId ? `/notes/new?bookId=${bookId}` : "/notes/new");
  }, [router, continueBook]);

  // "독서" 항목 — 진행 중이면 종료 시트, 아니면 시작 시트
  const handleReadingAction = useCallback(() => {
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
      openRecordEnd(activeSession.id, { book });
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
    openRecordStart({ book });
  }, [activeSession, continueBook, openRecordStart, openRecordEnd]);

  const renderNavItem = useCallback((item: SidebarItem) => {
    const Icon = item.icon;

    // action 기반 항목 (Quick Capture 등)
    if (item.action === "quickCapture") {
      return (
        <Button
          key="quickCapture"
          variant="ghost"
          className="w-full justify-start gap-3 h-11"
          onClick={handleQuickCapture}
          aria-label={item.label}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1 text-left">{item.label}</span>
        </Button>
      );
    }

    if (item.action === "stampCapture") {
      return (
        <Button
          key="stampCapture"
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-emerald-700 dark:text-emerald-400"
          onClick={handleStampCapture}
          aria-label={item.label}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1 text-left">{item.label}</span>
        </Button>
      );
    }

    // "기록" — 자유 노트 작성 페이지로 이동
    if (item.action === "noteWrite") {
      return (
        <Button
          key="noteWrite"
          variant="ghost"
          className="w-full justify-start gap-3 h-11"
          onClick={handleNoteWrite}
          aria-label="기록 작성"
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1 text-left">기록</span>
        </Button>
      );
    }

    // "독서" — 진행 중이면 "멈춤"(rose+펄스), 아니면 시작(forest)
    if (item.action === "readingStart") {
      const isActive = !!activeSession;
      return (
        <Button
          key="readingStart"
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-11 relative transition-colors",
            isActive
              ? "bg-rose-500 text-white hover:bg-rose-600 hover:text-white ring-2 ring-rose-300 dark:ring-rose-700"
              : "text-forest-700 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-950/30",
          )}
          onClick={handleReadingAction}
          aria-label={isActive ? "독서 멈춤" : "독서 시작"}
          aria-pressed={isActive}
        >
          {isActive ? (
            <Square className="h-5 w-5 fill-current" aria-hidden="true" />
          ) : (
            <Icon className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="flex-1 text-left">{isActive ? "멈춤" : "독서"}</span>
          {isActive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-200" />
            </span>
          )}
        </Button>
      );
    }

    const isActive = item.href
      ? pathname === item.href || pathname.startsWith(item.href + "/")
      : false;

    // "내 서재" 항목은 서재 트리로 대체
    if (item.href === "/books" && user) {
      return null;
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-11",
            isActive && "bg-secondary font-medium"
          )}
          aria-label={item.label}
          aria-pressed={isActive}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge variant="secondary" className="ml-auto" aria-label={`${item.badge}개의 알림`}>
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  }, [pathname, user, handleQuickCapture, handleStampCapture, handleNoteWrite, handleReadingAction, activeSession]);

  const visibleSecondaryItems = secondaryItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-background lg:z-50"
      aria-label={t("nav.mainNav")}
    >
      <div className="flex flex-col flex-1 pt-6 pb-4 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center flex-shrink-0 px-6 mb-8 gap-2 hover:opacity-80 transition-opacity duration-200"
          aria-label={t("nav.goHome")}
        >
          <Trees className="w-8 h-8 text-forest-600" />
          <h1 className="text-xl font-bold">ReadTree</h1>
        </Link>
        <nav className="flex-1 px-3 space-y-1" aria-label={t("nav.mainMenu")}>
          {/* 핵심 메뉴 */}
          {primaryItems.map(renderNavItem)}

          {/* 서재 트리 (로그인 사용자만) */}
          {user && <BookshelfTree />}

          {/* 더보기 접이식 그룹 */}
          {visibleSecondaryItems.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex items-center gap-2 px-3 py-2 w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-expanded={isMoreOpen}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isMoreOpen && "rotate-180"
                  )}
                />
                <span>{t("nav.more")}</span>
              </button>
              {isMoreOpen && (
                <div className="space-y-1">
                  {visibleSecondaryItems.map(renderNavItem)}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

