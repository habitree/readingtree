"use client";

import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface TagWithCount {
  tag: string;
  count: number;
}

interface TagCloudProps {
  tags: TagWithCount[];
  activeTag?: string;
  onTagClick: (tag: string) => void;
  onClear: () => void;
}

/**
 * 태그 클라우드 — 사용 빈도에 따라 태그 크기가 달라진다.
 * 활성 태그 클릭 시 필터 해제, 비활성 태그 클릭 시 필터 적용.
 */
export function TagCloud({ tags, activeTag, onTagClick, onClear }: TagCloudProps) {
  const { t } = useTranslation();

  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count), 1);

  const getFontSize = (count: number): string => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return "text-sm font-semibold";
    if (ratio >= 0.5) return "text-xs font-medium";
    return "text-[11px]";
  };

  const getOpacity = (count: number): string => {
    const ratio = count / maxCount;
    if (ratio >= 0.6) return "";
    if (ratio >= 0.3) return "opacity-80";
    return "opacity-60";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {t("notes.tagCloud")}
        </span>
        {activeTag && (
          <button
            onClick={onClear}
            className="ml-auto text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
          >
            {t("notes.tagFilterClear")}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(({ tag, count }) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => (isActive ? onClear() : onTagClick(tag))}
              className={cn(
                "rounded-full px-2.5 py-0.5 transition-colors",
                getFontSize(count),
                getOpacity(count),
                isActive
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700 dark:hover:text-amber-300"
              )}
            >
              #{tag}
              <span className="ml-1 text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
