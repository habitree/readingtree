"use client";

import { useState, useEffect, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useAnonymousId } from "@/hooks/use-anonymous-id";
import {
  addReportReaction,
  removeReportReaction,
  getUserReportReactions,
} from "@/app/actions/ai/report-reactions";
import type {
  ReportReactionType,
  ReportReactionCounts,
} from "@/types/ai/report";
import { REACTION_META } from "@/types/ai/report";

interface ReportReactionsProps {
  reportId: string;
  initialCounts: ReportReactionCounts;
}

export function ReportReactions({
  reportId,
  initialCounts,
}: ReportReactionsProps) {
  const anonymousId = useAnonymousId();
  const [counts, setCounts] = useState(initialCounts);
  const [userReactions, setUserReactions] = useState<ReportReactionType[]>([]);
  const [isPending, startTransition] = useTransition();

  // 클라이언트에서 anonymous_id 확정 후 기존 반응 로드
  useEffect(() => {
    if (!anonymousId) return;
    getUserReportReactions(reportId, anonymousId).then((reactions) => {
      setUserReactions(reactions);
    });
  }, [anonymousId, reportId]);

  const handleToggleReaction = (type: ReportReactionType) => {
    if (!anonymousId) return;
    const isActive = userReactions.includes(type);

    // 낙관적 업데이트
    if (isActive) {
      setUserReactions((prev) => prev.filter((r) => r !== type));
      setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
    } else {
      setUserReactions((prev) => [...prev, type]);
      setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    }

    startTransition(async () => {
      const result = isActive
        ? await removeReportReaction(reportId, type, anonymousId)
        : await addReportReaction(reportId, type, anonymousId);

      if (!result.success) {
        // 롤백
        if (isActive) {
          setUserReactions((prev) => [...prev, type]);
          setCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
        } else {
          setUserReactions((prev) => prev.filter((r) => r !== type));
          setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-xs text-muted-foreground">이 리포트가 도움이 됐나요?</p>
      <div className="flex flex-wrap justify-center gap-2">
        {(Object.keys(REACTION_META) as ReportReactionType[]).map((type) => {
          const { emoji, label } = REACTION_META[type];
          const isActive = userReactions.includes(type);
          const count = counts[type];

          return (
            <button
              key={type}
              onClick={() => handleToggleReaction(type)}
              disabled={isPending || !anonymousId}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all",
                "hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                isActive
                  ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                  : "bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-muted-foreground hover:border-primary/20"
              )}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span>{label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "text-xs font-bold tabular-nums",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
