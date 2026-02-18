import { Badge } from "@/components/ui/badge";
import type { ReadingStatus } from "@/types/book";
import { cn } from "@/lib/utils";

interface BookStatusBadgeProps {
  status: ReadingStatus;
  className?: string;
  size?: "sm" | "default";
}

/**
 * 독서 상태 배지 컴포넌트
 * UX 원칙 03: 색상을 활용한 시각적 구분 적용
 */
export function BookStatusBadge({ status, className, size = "default" }: BookStatusBadgeProps) {
  const statusConfig = {
    reading: {
      label: "읽는 중",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    completed: {
      label: "완독",
      className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    },
    paused: {
      label: "쉬는 중",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    },
    not_started: {
      label: "읽을 예정",
      className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    },
    rereading: {
      label: "재독",
      className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    },
  };

  const config = statusConfig[status];

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0",
    default: "",
  };

  return (
    <Badge
      variant="outline"
      className={cn("border", config.className, sizeClasses[size], className)}
    >
      {config.label}
    </Badge>
  );
}

