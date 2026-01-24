"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PenTool, BookPlus, Camera, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobileNoteSheet, type NoteMode } from "@/hooks/use-mobile-note-sheet";

interface QuickActionItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  /** 클릭 시 바텀시트를 열기 위한 모드 (href 대신 사용) */
  sheetMode?: NoteMode;
  color: string;
  bgColor: string;
  description: string;
}

const quickActions: QuickActionItem[] = [
  {
    icon: PenTool,
    label: "기록",
    sheetMode: "memo",
    color: "text-forest-600",
    bgColor: "bg-forest-50 dark:bg-forest-900/30",
    description: "새 기록 작성",
  },
  {
    icon: BookPlus,
    label: "책 추가",
    href: "/books/search",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    description: "새 책 등록",
  },
  {
    icon: Camera,
    label: "필사",
    sheetMode: "transcription",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-900/30",
    description: "사진으로 기록",
  },
  {
    icon: Search,
    label: "검색",
    href: "/search",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-900/30",
    description: "기록 검색",
  },
];

/**
 * 모바일 퀵 액션 버튼 섹션
 * 심리학적 관점: 즉각적인 행동 유도 (Fogg 행동 모델의 '촉발' 요소)
 */
export function MobileQuickActions() {
  const { open } = useMobileNoteSheet();

  return (
    <div className="grid grid-cols-4 gap-2 sm:hidden">
      {quickActions.map((action, index) => {
        // 바텀시트를 여는 액션인 경우 버튼으로 렌더링
        if (action.sheetMode) {
          return (
            <button
              key={`action-${index}`}
              type="button"
              onClick={() => open(action.sheetMode)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-all"
            >
              <div
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center shadow-sm",
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
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 active:scale-95 transition-all"
          >
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center shadow-sm",
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
  );
}

/** 데스크탑용 퀵 액션 아이템 (href 필수) */
const desktopQuickActions = [
  {
    icon: PenTool,
    label: "기록",
    href: "/notes/new",
    color: "text-forest-600",
    description: "새 기록 작성",
  },
  {
    icon: BookPlus,
    label: "책 추가",
    href: "/books/search",
    color: "text-blue-600",
    description: "새 책 등록",
  },
  {
    icon: Camera,
    label: "필사",
    href: "/notes/new?type=transcription",
    color: "text-purple-600",
    description: "사진으로 기록",
  },
];

/**
 * 데스크탑용 퀵 액션 (가로 형태)
 * 데스크탑에서는 기존 URL 방식 유지
 */
export function DesktopQuickActions() {
  return (
    <div className="hidden sm:flex gap-2">
      {desktopQuickActions.map((action) => (
        <Button
          key={action.href}
          variant="outline"
          size="sm"
          asChild
          className="gap-2"
        >
          <Link href={action.href}>
            <action.icon className={cn("h-4 w-4", action.color)} />
            {action.description}
          </Link>
        </Button>
      ))}
    </div>
  );
}
