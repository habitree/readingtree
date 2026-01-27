import { Building2, Hash, Calendar, Trophy } from "lucide-react";
import { formatDate } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

interface BookMetaInfoProps {
  publisher?: string | null;
  isbn?: string | null;
  startedAt?: string | null;
  completedDates?: string[];
  /** 그리드 레이아웃 사용 여부 (기본: true) */
  useGrid?: boolean;
  className?: string;
}

/**
 * 책 메타 정보 컴포넌트
 * 출판사, ISBN, 시작일, 완독 횟수를 표시
 */
export function BookMetaInfo({
  publisher,
  isbn,
  startedAt,
  completedDates = [],
  useGrid = true,
  className,
}: BookMetaInfoProps) {
  const hasAnyMeta = publisher || isbn || startedAt || completedDates.length > 0;

  if (!hasAnyMeta) {
    return null;
  }

  return (
    <div
      className={cn(
        useGrid ? "grid grid-cols-2 gap-3" : "flex flex-wrap gap-3",
        className
      )}
    >
      {publisher && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4 shrink-0 opacity-60" />
          <span className="truncate">{publisher}</span>
        </div>
      )}
      {isbn && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="w-4 h-4 shrink-0 opacity-60" />
          <span className="truncate font-mono text-xs">{isbn}</span>
        </div>
      )}
      {startedAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0 opacity-60" />
          <span>{formatDate(startedAt)} 시작</span>
        </div>
      )}
      {completedDates.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 shrink-0 text-emerald-500" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {completedDates.length}회 완독
          </span>
        </div>
      )}
    </div>
  );
}
