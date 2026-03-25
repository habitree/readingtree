"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PenTool, BookPlus, Camera, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuickCaptureStore } from "@/hooks/use-quick-capture";

type NoteMode = "memo" | "transcription";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslation } from "@/lib/i18n";

interface QuickActionItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  /** 클릭 시 바텀시트를 열기 위한 모드 (href 대신 사용) */
  sheetMode?: NoteMode;
  /** 데스크톱에서 sheetMode 대신 이동할 URL */
  desktopHref?: string;
  color: string;
  bgColor: string;
  description: string;
}

// Quick action definitions with i18n keys
const QUICK_ACTION_KEYS = [
  {
    icon: PenTool,
    labelKey: "dashboard.quickWriteNote" as const,
    sheetMode: "memo" as NoteMode,
    desktopHref: "/notes/new",
    color: "text-forest-600 dark:text-forest-400",
    bgColor: "bg-forest-50/60 dark:bg-forest-900/20",
    descKey: "dashboard.quickWriteNoteDesc" as const,
  },
  {
    icon: BookPlus,
    labelKey: "dashboard.quickAddBook" as const,
    href: "/books/search",
    color: "text-forest-600 dark:text-forest-400",
    bgColor: "bg-forest-50/60 dark:bg-forest-900/20",
    descKey: "dashboard.quickAddBookDesc" as const,
  },
  {
    icon: Camera,
    labelKey: "dashboard.quickTranscription" as const,
    sheetMode: "transcription" as NoteMode,
    desktopHref: "/notes/new?type=transcription",
    color: "text-forest-600 dark:text-forest-400",
    bgColor: "bg-forest-50/60 dark:bg-forest-900/20",
    descKey: "dashboard.quickTranscriptionDesc" as const,
  },
  {
    icon: Search,
    labelKey: "dashboard.quickSearch" as const,
    href: "/search",
    color: "text-forest-600 dark:text-forest-400",
    bgColor: "bg-forest-50/60 dark:bg-forest-900/20",
    descKey: "dashboard.quickSearchDesc" as const,
  },
];

/**
 * 퀵 액션 버튼 섹션
 * 모바일: 바텀시트 / 데스크톱: URL 네비게이션
 */
export function MobileQuickActions() {
  const { open: openQuickCapture } = useQuickCaptureStore();
  const { isOpen, setIsOpen, title, description, requireLogin } = useLoginPrompt();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const router = useRouter();
  const { t } = useTranslation();

  // Build quickActions with translated labels
  const quickActions: QuickActionItem[] = QUICK_ACTION_KEYS.map(k => ({
    ...k,
    label: t(k.labelKey),
    description: t(k.descKey),
  }));

  const handleSheetAction = useCallback((action: QuickActionItem) => {
    if (requireLogin({
      title: t("auth.loginToWrite"),
      description: t("auth.loginToWriteDesc"),
    })) return;

    // 데스크톱에서는 URL 네비게이션
    if (isDesktop && action.desktopHref) {
      router.push(action.desktopHref);
      return;
    }
    // 모바일에서는 바텀시트
    if (action.sheetMode) {
      openQuickCapture();
    }
  }, [openQuickCapture, requireLogin, isDesktop, router]);

  const handleLinkClick = useCallback((e: React.MouseEvent, action: QuickActionItem) => {
    const isSearch = action.label === t("dashboard.quickSearch");
    if (requireLogin({
      title: isSearch ? t("auth.loginToSearch") : t("auth.loginToAddBook"),
      description: isSearch ? t("auth.loginToSearchDesc") : t("auth.loginToAddBookDesc"),
    })) {
      e.preventDefault();
    }
  }, [requireLogin, t]);

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action, index) => {
          // 바텀시트를 여는 액션인 경우 버튼으로 렌더링
          if (action.sheetMode) {
            return (
              <button
                key={`action-${index}`}
                type="button"
                onClick={() => handleSheetAction(action)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-transform duration-150"
              >
                <div
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center",
                    action.bgColor
                  )}
                >
                  <action.icon className={cn("h-5 w-5", action.color)} />
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {action.label}
                </span>
              </button>
            );
          }

          // 기존 Link 방식
          return (
            <Link
              key={action.href}
              href={action.href!}
              onClick={(e) => handleLinkClick(e, action)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-transform duration-150"
            >
              <div
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center",
                  action.bgColor
                )}
              >
                <action.icon className={cn("h-5 w-5", action.color)} />
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
      <LoginPromptModal open={isOpen} onOpenChange={setIsOpen} title={title} description={description} />
    </>
  );
}

/** 데스크탑용 퀵 액션 아이템 (href 필수) */
const DESKTOP_QUICK_ACTION_KEYS = [
  {
    icon: PenTool,
    labelKey: "dashboard.quickWriteNote" as const,
    href: "/notes/new",
    color: "text-forest-600",
    descKey: "dashboard.quickWriteNoteDesc" as const,
  },
  {
    icon: BookPlus,
    labelKey: "dashboard.quickAddBook" as const,
    href: "/books/search",
    color: "text-forest-600",
    descKey: "dashboard.quickAddBookDesc" as const,
  },
  {
    icon: Camera,
    labelKey: "dashboard.quickTranscription" as const,
    href: "/notes/new?type=transcription",
    color: "text-forest-600",
    descKey: "dashboard.quickTranscriptionDesc" as const,
  },
];

/**
 * 데스크탑용 퀵 액션 (가로 형태)
 * 데스크탑에서는 기존 URL 방식 유지
 */
export function DesktopQuickActions() {
  const { t } = useTranslation();
  return (
    <div className="hidden sm:flex gap-2">
      {DESKTOP_QUICK_ACTION_KEYS.map((action) => (
        <Button
          key={action.href}
          variant="outline"
          size="sm"
          asChild
          className="gap-2"
        >
          <Link href={action.href}>
            <action.icon className={cn("h-4 w-4", action.color)} />
            {t(action.descKey)}
          </Link>
        </Button>
      ))}
    </div>
  );
}
