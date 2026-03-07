"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, ChevronRight } from "lucide-react";
import { getUserPoints } from "@/app/actions/points";
import { useAuth } from "@/hooks/use-auth";
import { LEVEL_STYLES, LEVEL_DEFAULTS } from "@/types/points";
import type { UserPoints } from "@/types/points";
import { cn } from "@/lib/utils";

export function PricingPointsBanner() {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserPoints | null>(null);

  useEffect(() => {
    if (user) {
      getUserPoints().then(setPoints);
    }
  }, [user]);

  if (!user || !points) return null;

  const levelStyle = LEVEL_STYLES[points.current_level] || LEVEL_STYLES[1];
  const levelInfo = LEVEL_DEFAULTS.find((l) => l.level === points.current_level);

  return (
    <Link href="/points" className="block">
      <div className="rounded-xl border bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/20 dark:to-emerald-950/20 border-forest-200 dark:border-forest-800 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
              levelStyle.bgColor, levelStyle.borderColor, "border"
            )}>
              {levelStyle.emoji}
            </div>
            <div>
              <div className="text-xs text-muted-foreground">
                Lv.{points.current_level} {levelInfo?.title}
              </div>
              <div className="flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="text-xl font-bold text-forest-600 dark:text-forest-400 tabular-nums">
                  {points.total_points.toLocaleString()}P
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  보유 중
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>내역 보기</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
