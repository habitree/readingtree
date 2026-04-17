"use client";

import { cn } from "@/lib/utils";

export interface PointFlowChartProps {
  data: { date: string; earned: number; spent: number }[];
}

/**
 * 경량 포인트 흐름 차트 (recharts 미의존).
 * 일별 earned (녹색) / spent (적색)을 쌓지 않고 나란히 막대로 표시.
 */
export function PointFlowChart({ data }: PointFlowChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-6 text-center text-xs text-muted-foreground">
        최근 7일 포인트 거래 기록이 없어요.
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.earned, d.spent]),
    1,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        {data.map((row) => {
          const earnedH = (row.earned / maxValue) * 100;
          const spentH = (row.spent / maxValue) * 100;
          return (
            <div
              key={row.date}
              className="flex flex-1 flex-col items-center gap-1 text-[10px] text-muted-foreground"
            >
              <div className="flex h-24 w-full items-end gap-0.5">
                <div
                  title={`${row.date} 적립 ${row.earned.toLocaleString()}P`}
                  className={cn(
                    "flex-1 rounded-t bg-emerald-500/80 transition-all",
                  )}
                  style={{ height: `${earnedH}%` }}
                />
                <div
                  title={`${row.date} 차감 ${row.spent.toLocaleString()}P`}
                  className={cn(
                    "flex-1 rounded-t bg-rose-500/80 transition-all",
                  )}
                  style={{ height: `${spentH}%` }}
                />
              </div>
              <span className="tabular-nums">
                {row.date.slice(5).replace("-", "/")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-emerald-500/80" />
          적립
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-rose-500/80" />
          차감
        </span>
      </div>
    </div>
  );
}
