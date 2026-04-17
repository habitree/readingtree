"use client";

import { cn } from "@/lib/utils";

export interface GrowthChannelTableProps {
  caption: string;
  rows: { channel: string; count: number }[];
  total: number;
  labelKey?: "channel";
}

const CHANNEL_LABELS: Record<string, string> = {
  kakao: "카카오톡",
  x: "X",
  copy_link: "링크 복사",
  native: "기기 공유",
  download: "이미지 저장",
  instagram: "인스타그램",
  note: "노트",
  report: "AI 리포트",
  completion: "완독 카드",
  bookshelf: "책장",
};

export function GrowthChannelTable({
  caption,
  rows,
  total,
}: GrowthChannelTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed bg-muted/20 p-4 text-center text-xs text-muted-foreground">
        {caption} · 데이터 없음
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">
        {caption}
      </p>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const percent = total > 0 ? (row.count / total) * 100 : 0;
          return (
            <li key={row.channel} className="flex items-center gap-3">
              <span className="w-20 shrink-0 truncate text-xs text-foreground">
                {CHANNEL_LABELS[row.channel] ?? row.channel}
              </span>
              <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-primary transition-all",
                  )}
                  style={{ width: `${Math.max(percent, 2)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right text-xs font-semibold tabular-nums">
                {row.count.toLocaleString()}
              </span>
              <span className="w-12 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
                {percent.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
