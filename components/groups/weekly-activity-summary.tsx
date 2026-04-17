"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, PenLine } from "lucide-react";
import { getGroupWeeklyStats } from "@/app/actions/groups";
import { useTranslation } from "@/lib/i18n";

interface WeeklyActivitySummaryProps {
  groupId: string;
}

export function WeeklyActivitySummary({ groupId }: WeeklyActivitySummaryProps) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getGroupWeeklyStats>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [groupId]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await getGroupWeeklyStats(groupId);
      setStats(data);
    } catch {
      // 통계 조회 실패 시 조용히 처리
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const { totalNotesThisWeek, weekOverWeekChange, memberStats } = stats;
  const topMembers = memberStats.filter((m) => m.notesCount > 0).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("groups.weeklyActivityTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalNotesThisWeek === 0 ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <PenLine className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("groups.weeklyNoActivity")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("groups.weeklyNoActivityDesc")}
            </p>
          </div>
        ) : (
          <>
            {/* 주간 기록 수 + 변화율 */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{totalNotesThisWeek}</span>
              <span className="text-sm text-muted-foreground">
                {t("groups.weeklyNotesCount").replace("{count}", String(totalNotesThisWeek))}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {weekOverWeekChange > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    {t("groups.weeklyCompareUp").replace("{percent}", String(weekOverWeekChange))}
                  </span>
                </>
              ) : weekOverWeekChange < 0 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-600 dark:text-red-400">
                    {t("groups.weeklyCompareDown").replace("{percent}", String(weekOverWeekChange))}
                  </span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t("groups.weeklyCompareSame")}
                  </span>
                </>
              )}
            </div>

            {/* Top 활동 멤버 */}
            {topMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("groups.weeklyTopContributors")}
                </p>
                <div className="space-y-1.5">
                  {topMembers.map((member) => (
                    <div
                      key={member.user?.id}
                      className="flex items-center gap-2.5 py-1"
                    >
                      <Link href={`/profile/${member.user?.id}`} className="shrink-0">
                        <Avatar className="h-6 w-6 hover:ring-2 hover:ring-primary/20 transition-all">
                          <AvatarImage src={member.user?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {member.user?.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <Link href={`/profile/${member.user?.id}`} className="text-sm truncate flex-1 hover:underline">
                        {member.user?.name}
                      </Link>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {t("groups.weeklyNotesUnit").replace("{count}", String(member.notesCount))}
                      </Badge>
                      {member.trend === "up" && (
                        <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
                      )}
                      {member.trend === "down" && (
                        <TrendingDown className="h-3 w-3 text-red-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
