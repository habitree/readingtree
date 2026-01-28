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
} from "lucide-react";
import { getMemberActivities } from "@/app/actions/groups";
import { toast } from "sonner";
import { formatSmartDate } from "@/lib/utils/date";
import Link from "next/link";
import type { MemberActivity } from "@/types/group";

interface MemberActivityListProps {
  groupId: string;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [groupId]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await getMemberActivities(groupId);
      // Sort by total shared notes descending
      const sorted = [...data].sort(
        (a, b) => b.totalSharedNotes - a.totalSharedNotes
      );
      setActivities(sorted);
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
