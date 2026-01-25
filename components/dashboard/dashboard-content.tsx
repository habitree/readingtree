import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LoginSuccessToast } from "./login-success-toast";

// Streaming SSR 섹션 컴포넌트
import {
  GoalProgressSection,
  RecentBooksSection,
  MonthlyStatsSection,
  HomeHeroWrapper,
  MobileQuickActions,
} from "./sections";

// 스켈레톤 컴포넌트
import {
  GoalProgressSkeleton,
  RecentBooksSkeleton,
  MonthlyStatsSkeleton,
  HomeHeroSkeleton,
} from "./skeletons";

/**
 * 게스트 사용자 배너 (동기 렌더링)
 */
async function GuestBanner() {
  const user = await getCurrentUser();
  if (user) return null;

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1">
                  샘플 데이터
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                샘플 데이터를 확인 중입니다. 로그인하여 나만의 독서 기록을 시작하세요.
              </p>
            </div>
          </div>
          <Button asChild fullWidth className="sm:w-auto sm:min-w-[120px]">
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 대시보드 컨텐츠 컴포넌트 (Streaming SSR)
 *
 * 각 섹션이 독립적으로 로드되어 점진적으로 화면에 표시됩니다.
 * 첫 번째 바이트(TTFB)가 빨라지고 사용자 체감 속도가 향상됩니다.
 */
export default async function DashboardContent() {
  return (
    <>
      {/* 로그인 성공 메시지 (클라이언트 컴포넌트) */}
      <LoginSuccessToast />

      <div className="space-y-6">
        {/* 게스트 배너 - 즉시 로드 */}
        <Suspense fallback={null}>
          <GuestBanner />
        </Suspense>

        {/* 홈 히어로 섹션 - 개인화 인사 + 페르소나 인사이트 */}
        <Suspense fallback={<HomeHeroSkeleton />}>
          <HomeHeroWrapper />
        </Suspense>

        {/* 모바일 퀵 액션 버튼 */}
        <MobileQuickActions />

        {/* 목표 진행률 - 스트리밍 */}
        <Suspense fallback={<GoalProgressSkeleton />}>
          <GoalProgressSection />
        </Suspense>

        {/* 최근 기록한 책 - 스트리밍 */}
        <Suspense fallback={<RecentBooksSkeleton />}>
          <RecentBooksSection />
        </Suspense>

        {/* 월별 통계 차트 - 스트리밍 (기본 접힌 상태) */}
        <Suspense fallback={<MonthlyStatsSkeleton />}>
          <MonthlyStatsSection />
        </Suspense>
      </div>
    </>
  );
}
