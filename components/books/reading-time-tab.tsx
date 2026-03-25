"use client";

import { useEffect, useState } from "react";
import { getReadingTimeLogs, getReadingTimeStats } from "@/app/actions/progress";
import { Clock, Timer, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReadingLog } from "@/types/progress";

interface ReadingTimeTabProps {
  userBookId: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

function formatTimeRange(startedAt: string | null, endedAt: string | null): string {
  if (!startedAt) return "";
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  const start = new Date(startedAt).toLocaleTimeString("ko-KR", opts);
  if (!endedAt) return start;
  const end = new Date(endedAt).toLocaleTimeString("ko-KR", opts);
  return `${start} ~ ${end}`;
}

function groupByDate(logs: ReadingLog[]): Map<string, ReadingLog[]> {
  const groups = new Map<string, ReadingLog[]>();
  const today = new Date().toLocaleDateString("ko-KR");
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("ko-KR");

  for (const log of logs) {
    const dateStr = new Date(log.created_at).toLocaleDateString("ko-KR");
    let label: string;
    if (dateStr === today) label = "오늘";
    else if (dateStr === yesterday) label = "어제";
    else label = dateStr;

    const existing = groups.get(label);
    if (existing) existing.push(log);
    else groups.set(label, [log]);
  }
  return groups;
}

export function ReadingTimeTab({ userBookId }: ReadingTimeTabProps) {
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [stats, setStats] = useState<{
    totalSeconds: number;
    sessionCount: number;
    averageSeconds: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [logsData, statsData] = await Promise.all([
          getReadingTimeLogs(userBookId),
          getReadingTimeStats(userBookId),
        ]);
        setLogs(logsData);
        setStats(statsData);
      } catch {
        // 에러 무시 (빈 상태)
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [userBookId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats || stats.sessionCount === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">
          아직 독서 시간 기록이 없습니다
        </p>
        <p className="text-xs text-muted-foreground/60">
          헤더의 타이머 버튼으로 독서를 시작해보세요
        </p>
      </div>
    );
  }

  const grouped = groupByDate(logs);

  return (
    <div className="space-y-5">
      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-center">
          <Timer className="w-4 h-4 text-primary mx-auto mb-1.5" />
          <p className="text-lg sm:text-xl font-bold text-primary tabular-nums">
            {formatDuration(stats.totalSeconds)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">총 독서 시간</p>
        </div>
        <div className="rounded-xl bg-muted/50 border p-3 text-center">
          <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-lg sm:text-xl font-bold tabular-nums">
            {stats.sessionCount}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">세션</p>
        </div>
        <div className="rounded-xl bg-muted/50 border p-3 text-center">
          <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-lg sm:text-xl font-bold tabular-nums">
            {formatDuration(stats.averageSeconds)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">평균/회</p>
        </div>
      </div>

      {/* 날짜별 기록 */}
      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([dateLabel, dateLogs]) => (
          <div key={dateLabel}>
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
              {dateLabel}
            </p>
            <div className="space-y-1.5">
              {dateLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Timer className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatDuration(log.reading_duration_seconds)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {formatTimeRange(log.started_at, log.ended_at)}
                      </span>
                    </div>
                    {log.memo && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {log.memo}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
