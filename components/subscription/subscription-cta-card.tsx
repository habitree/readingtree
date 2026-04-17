"use client";

import Link from "next/link";
import { Coins, Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface SubscriptionCtaCardProps {
  /** 서버에서 조회한 티어 값. free | reader_v2 | master_v2 */
  tier: "free" | "reader_v2" | "master_v2" | string;
  /** 사용자가 보유한 포인트 (선택, 프리 플랜에 표시) */
  points?: number | null;
  className?: string;
}

/**
 * 프로필·설정 페이지에서 구독 상태를 요약하고 자발적 업그레이드로 유도하는 카드.
 */
export function SubscriptionCtaCard({
  tier,
  points,
  className,
}: SubscriptionCtaCardProps) {
  const isPremium = tier === "reader_v2" || tier === "master_v2";
  const isMaster = tier === "master_v2";

  if (isPremium) {
    return (
      <Card
        className={cn(
          "overflow-hidden border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900 dark:from-amber-950/40 dark:to-orange-950/40",
          className,
        )}
      >
        <CardContent className="flex items-center gap-4 py-5">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-md",
              isMaster
                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                : "bg-gradient-to-br from-emerald-500 to-teal-500",
            )}
          >
            {isMaster ? <Crown className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
              현재 플랜
            </p>
            <p className="text-base font-bold text-foreground">
              {isMaster ? "ReadTree Master" : "ReadTree Reader"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              프리미엄 AI 기능과 높은 한도를 이용 중이에요.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">플랜 관리</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-amber-950/40",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-md">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              프리미엄 업그레이드
            </p>
            <p className="text-base font-bold text-foreground">
              AI 기능과 무제한 기록을 이어가세요
            </p>
            {typeof points === "number" && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Coins className="h-3 w-3" />
                현재 {points.toLocaleString()}P 보유
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:ml-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">요금제 보기</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/pricing">업그레이드</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
