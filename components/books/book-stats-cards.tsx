"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, BookMarked, CheckCircle2, Pause, BookX, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { BookStats } from "@/app/actions/books";
import type { ReadingStatus } from "@/types/book";

interface BookStatsCardsProps {
  stats: BookStats;
  className?: string;
}

/**
 * 책 상태별 통계 카드 컴포넌트
 * habitree.io/search 페이지의 상단 통계 카드와 유사한 형태
 */
export function BookStatsCards({ stats, className }: BookStatsCardsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 현재 경로에 따라 기본 경로 결정 (서재 개별 페이지인지 확인)
  const basePath = pathname?.startsWith("/bookshelves/") ? pathname : "/books";

  const statItems = [
    {
      label: "총등록",
      value: stats.total,
      icon: BookOpen,
      color: "blue",
      status: null,
    },
    {
      label: "읽을 예정",
      value: stats.not_started,
      icon: BookX,
      color: "gray",
      status: "not_started" as const,
    },
    {
      label: "읽는중",
      value: stats.reading,
      icon: BookMarked,
      color: "green",
      status: "reading" as const,
    },
    {
      label: "완독",
      value: stats.completed,
      icon: CheckCircle2,
      color: "purple",
      status: "completed" as const,
    },
    {
      label: "재독",
      value: stats.rereading,
      icon: RotateCcw,
      color: "cyan",
      status: "rereading" as const,
    },
    {
      label: "멈춤",
      value: stats.paused,
      icon: Pause,
      color: "orange",
      status: "paused" as const,
    },
  ];

  const handleClick = (status: ReadingStatus | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className={cn("grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3", className)}>
      {statItems.map((item) => {
        const Icon = item.icon;
        const currentStatus = searchParams.get("status");
        const isActive =
          (item.status === null && !currentStatus) ||
          (item.status !== null && currentStatus === item.status);

        const colorClasses = {
          blue: "border-l-blue-500 bg-blue-500/5",
          green: "border-l-green-500 bg-green-500/5",
          purple: "border-l-purple-500 bg-purple-500/5",
          orange: "border-l-orange-500 bg-orange-500/5",
          gray: "border-l-gray-500 bg-gray-500/5",
          cyan: "border-l-cyan-500 bg-cyan-500/5",
        };

        const iconColorClasses = {
          blue: "text-blue-600",
          green: "text-green-600",
          purple: "text-purple-600",
          orange: "text-orange-600",
          gray: "text-gray-600",
          cyan: "text-cyan-600",
        };

        const iconBgClasses = {
          blue: "bg-blue-500/10",
          green: "bg-green-500/10",
          purple: "bg-purple-500/10",
          orange: "bg-orange-500/10",
          gray: "bg-gray-500/10",
          cyan: "bg-cyan-500/10",
        };

        return (
          <button
            key={item.label}
            onClick={() => handleClick(item.status)}
            className="w-full text-left cursor-pointer hover:shadow-md transition-[box-shadow,transform] duration-150 active:scale-[0.98]"
            aria-label={`${item.label}: ${item.value}권`}
          >
            <Card
              className={cn(
                "border-l-4 h-full transition-colors duration-150",
                colorClasses[item.color as keyof typeof colorClasses],
                // UX 원칙 07: 선택 색상 단순화 - 핵심 포인트 컬러(primary)만 사용
                isActive && "ring-2 ring-primary ring-offset-2 shadow-md"
              )}
            >
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <div
                    className={cn(
                      "rounded-lg p-1.5 sm:p-2",
                      iconBgClasses[item.color as keyof typeof iconBgClasses]
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3 w-3 sm:h-4 sm:w-4",
                        iconColorClasses[item.color as keyof typeof iconColorClasses]
                      )}
                      aria-hidden="true"
                    />
                  </div>
                  <CardDescription className="text-xs sm:text-sm font-medium">
                    {item.label}
                  </CardDescription>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {item.value}권
                </CardTitle>
              </CardHeader>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

