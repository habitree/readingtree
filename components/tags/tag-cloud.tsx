"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagCloudProps {
  tags: { tag: string; count: number }[];
}

/**
 * 태그 클라우드 컴포넌트
 * 사용 빈도에 따라 태그 크기 차등 표시
 */
export function TagCloud({ tags }: TagCloudProps) {
  if (tags.length === 0) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));

  const getSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "text-base font-bold";
    if (ratio > 0.4) return "text-sm font-semibold";
    return "text-xs font-medium";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/search?q=${encodeURIComponent(tag)}&filter=tag`}
        >
          <Badge
            variant="secondary"
            className={cn(
              "cursor-pointer hover:bg-forest-100 dark:hover:bg-forest-900/30 transition-colors px-3 py-1.5",
              getSize(count)
            )}
          >
            #{tag}
            <span className="ml-1.5 text-muted-foreground font-normal">
              {count}
            </span>
          </Badge>
        </Link>
      ))}
    </div>
  );
}
