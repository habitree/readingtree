"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crown,
  Quote,
  Camera,
  FileText,
  ScanText,
  Trophy,
  Medal,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Flame,
} from "lucide-react";
import { getMemberActivities, getGroupWeeklyStats } from "@/app/actions/groups";
import { toast } from "sonner";
import { formatSmartDate } from "@/lib/utils/date";
import Link from "next/link";
import type { MemberActivity } from "@/types/group";

interface MemberActivityListProps {
  groupId: string;
}

interface WeeklyStats {
  weekStart: string;
  totalNotesThisWeek: number;
  totalNotesLastWeek: number;
  weekOverWeekChange: number;
  memberStats: {
    rank: number;
    user: { id: string; name: string; avatar_url: string | null };
    notesCount: number;
    booksCompleted: number;
    lastWeekCount: number;
    trend: "up" | "down" | "same";
  }[];
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-2 w-full" />
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500 text-white">
        <Trophy className="mr-1 h-3 w-3" />1st
      </Badge>
    );
  }
  if (rank === 2) {
    return (
      <Badge className="bg-slate-400 hover:bg-slate-400 text-white">
        <Medal className="mr-1 h-3 w-3" />2nd
      </Badge>
    );
  }
  if (rank === 3) {
    return (
      <Badge className="bg-amber-700 hover:bg-amber-700 text-white">
        <Medal className="mr-1 h-3 w-3" />3rd
      </Badge>
    );
  }
  return null;
}

export function MemberActivityList({ groupId }: MemberActivityListProps) {
  const [activities, setActivities] = useState<MemberActivity[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [groupId]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const [activitiesData, weeklyData] = await Promise.all([
        getMemberActivities(groupId),
        getGroupWeeklyStats(groupId).catch(() => null),
      ]);
      // Sort by total shared notes descending
      const sorted = [...activitiesData].sort(
        (a, b) => b.totalSharedNotes - a.totalSharedNotes
      );
      setActivities(sorted);
      setWeeklyStats(weeklyData);
    } catch (error) {
      console.error("활동 조회 오류:", error);
      toast.error("활동을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">멤버 활동 현황</h3>
          <p className="text-sm text-muted-foreground">
            각 멤버가 공유한 기록 현황을 확인하세요
          </p>
        </div>
        <ActivitySkeleton />
      </div>
    );
  }

  const maxNotes = Math.max(...activities.map((a) => a.totalSharedNotes), 1);
  const totalNotes = activities.reduce((sum, a) => sum + a.totalSharedNotes, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">멤버 활동 현황</h3>
          <p className="text-sm text-muted-foreground">
            각 멤버가 공유한 기록 현황을 확인하세요
          </p>
        </div>
        {totalNotes > 0 && (
          <Badge variant="outline" className="text-sm">
            총 {totalNotes}개 기록
          </Badge>
        )}
      </div>

      {/* 이번 주 활동 통계 */}
      {weeklyStats && weeklyStats.totalNotesThisWeek > 0 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-semibold text-sm">이번 주 활동</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {weeklyStats.totalNotesThisWeek}
                </div>
                <div className="text-xs text-muted-foreground">공유된 기록</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {weeklyStats.memberStats.length}
                </div>
                <div className="text-xs text-muted-foreground">활동 멤버</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-2xl font-bold">
                    {weeklyStats.weekOverWeekChange > 0 ? "+" : ""}
                    {weeklyStats.weekOverWeekChange}%
                  </span>
                  {weeklyStats.weekOverWeekChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : weeklyStats.weekOverWeekChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">지난 주 대비</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">
                  {weeklyStats.memberStats[0]?.user?.name?.slice(0, 4) || "-"}
                </div>
                <div className="text-xs text-muted-foreground">이번 주 MVP</div>
              </div>
            </div>
            {/* 이번 주 랭킹 */}
            {weeklyStats.memberStats.length > 0 && (
              <div className="mt-4 pt-3 border-t border-primary/10">
                <div className="text-xs text-muted-foreground mb-2">이번 주 랭킹</div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {weeklyStats.memberStats.slice(0, 5).map((stat, idx) => (
                    <div
                      key={stat.user.id}
                      className="flex items-center gap-1.5 bg-background/80 rounded-full px-2 py-1 text-xs shrink-0"
                    >
                      <span className={`font-bold ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : ""}`}>
                        {idx + 1}.
                      </span>
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={stat.user.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {stat.user.name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[60px]">{stat.user.name}</span>
                      <span className="text-muted-foreground">({stat.notesCount})</span>
                      {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-red-500" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activities.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-2">아직 활동이 없어요</h4>
              <p className="text-sm text-muted-foreground max-w-xs">
                멤버들이 기록을 공유하면 여기에서 활동 현황을 확인할 수 있어요.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {activities.map((activity, index) => {
            const rank = index + 1;
            const hasContributed = activity.totalSharedNotes > 0;

            return (
              <Card
                key={activity.user.id}
                className={`overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-2 ${
                  rank <= 3 && hasContributed ? "ring-1 ring-primary/20" : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-3 md:gap-4">
                    <Link href={`/profile/${activity.user.id}`}>
                      <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-background hover:ring-primary/20 transition-all">
                        <AvatarImage
                          src={activity.user.avatar_url || undefined}
                        />
                        <AvatarFallback className="text-sm md:text-base">
                          {activity.user.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Link
                          href={`/profile/${activity.user.id}`}
                          className="font-semibold hover:underline truncate"
                        >
                          {activity.user.name}
                        </Link>
                        {activity.role === "leader" && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400"
                          >
                            <Crown className="mr-1 h-3 w-3" />
                            리더
                          </Badge>
                        )}
                        {hasContributed && getRankBadge(rank)}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="text-muted-foreground">
                              공유 기록
                            </span>
                            <span className="font-semibold text-primary">
                              {activity.totalSharedNotes}개
                            </span>
                          </div>
                          <Progress
                            value={(activity.totalSharedNotes / maxNotes) * 100}
                            className="h-2"
                          />
                        </div>

                        {hasContributed && (
                          <div className="flex items-center gap-2 md:gap-3 flex-wrap text-xs md:text-sm">
                            {activity.noteTypes.quote > 0 && (
                              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                                <Quote className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{activity.noteTypes.quote}</span>
                              </div>
                            )}
                            {activity.noteTypes.memo > 0 && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{activity.noteTypes.memo}</span>
                              </div>
                            )}
                            {activity.noteTypes.photo > 0 && (
                              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                                <Camera className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{activity.noteTypes.photo}</span>
                              </div>
                            )}
                            {activity.noteTypes.transcription > 0 && (
                              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-full">
                                <ScanText className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{activity.noteTypes.transcription}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {activity.lastSharedAt && (
                          <p className="text-xs text-muted-foreground">
                            최근 공유: {formatSmartDate(activity.lastSharedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
