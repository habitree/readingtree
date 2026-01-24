import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getGoalProgress } from "@/app/actions/stats";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { Target } from "lucide-react";

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
              <CardTitle className="mb-2">올해 독서 목표</CardTitle>
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
                  "목표를 설정해주세요"
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
            <Progress value={progress.progress} className="h-3" />
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
                <Link href="/profile">목표 설정하기</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
