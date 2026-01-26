import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGoalProgress } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 목표 진행률 섹션 (Streaming SSR)
 */
export async function GoalProgressSection() {
  const user = await getCurrentUser();
  const isGuest = !user;
  const progress = await getGoalProgress(user);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="mb-2">목표</CardTitle>
              <CardDescription className="text-base">
                {progress ? (
                  <>
                    <span className="font-semibold text-foreground">{progress.completed}</span>
                    <span className="text-muted-foreground"> / </span>
                    <span className="font-semibold text-foreground">{progress.goal}</span>
                    <span className="text-muted-foreground">권 완독</span>
                    {isGuest && <span className="ml-2 text-xs text-muted-foreground">(샘플)</span>}
                  </>
                ) : (
                  "목표 없음"
                )}
              </CardDescription>
            </div>
          </div>
          {isGuest && (
            <Badge variant="outline" className="text-xs shrink-0">샘플</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {progress && progress.goal > 0 ? (
          <div className="space-y-3">
            {/* 마일스톤 마커가 있는 진행률 바 (Near-miss Effect - 목표 근접 시 지속력 증가) */}
            <div className="relative">
              <Progress value={progress.progress} className="h-3" />
              {/* 25%, 50%, 75% 마일스톤 마커 */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="absolute left-1/4 -translate-x-1/2 w-0.5 h-5 bg-muted-foreground/30 rounded-full" />
                <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-5 bg-muted-foreground/40 rounded-full" />
                <div className="absolute left-3/4 -translate-x-1/2 w-0.5 h-5 bg-muted-foreground/30 rounded-full" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  {progress.progress}% 완료
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                  {progress.remaining}권 남음
                </span>
              </div>

              {/* 75% 이상일 때 "거의 다 왔어요!" 펄스 배지 */}
              {progress.progress >= 75 && progress.progress < 100 && (
                <Badge
                  variant="default"
                  className={cn(
                    "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
                    "animate-pulse"
                  )}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  거의 다 왔어요!
                </Badge>
              )}

              {/* 100% 달성 시 축하 배지 */}
              {progress.progress >= 100 && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  목표 달성! 🎉
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isGuest
                ? "로그인하여 독서 목표를 설정하세요"
                : "프로필에서 독서 목표를 설정하세요"}
            </p>
            {!isGuest && (
              <Button asChild variant="outline" fullWidth className="max-w-xs">
                <Link href="/profile">설정</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
