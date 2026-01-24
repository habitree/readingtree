import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { BookOpen, Megaphone } from "lucide-react";
import { LoginSuccessToast } from "./login-success-toast";

// Streaming SSR 섹션 컴포넌트
import {
  GoalProgressSection,
  StatsCardsSection,
  RecentBooksSection,
  MonthlyStatsSection,
  RecentNotesSection,
  TopBooksSection,
  HomeHeroWrapper,
  MobileQuickActions,
} from "./sections";

// 스켈레톤 컴포넌트
import {
  GoalProgressSkeleton,
  StatsCardsSkeleton,
  RecentBooksSkeleton,
  MonthlyStatsSkeleton,
  RecentNotesSkeleton,
  TopBooksSkeleton,
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
 * 서비스 소식 섹션 (정적)
 */
function NewsSection() {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-2">새로운 소식</h3>
            <p className="text-sm text-muted-foreground">
              독서 기록이 사라지지 않는 시대: Readtree 독서플랫폼이 읽었던 문장을 다시 찾고 공유할 수 있게 해줍니다.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="https://habitree.github.io/habitree_pr/#press-release" target="_blank" rel="noopener noreferrer">
              보도자료 보기
            </Link>
          </Button>
        </div>
      </div>
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

      <div className="space-y-4 sm:space-y-6">
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

        {/* 통계 카드 - 스트리밍 (모바일에서 히어로 섹션에 이미 일부 표시되므로 숨김) */}
        <div className="hidden sm:block">
          <Suspense fallback={<StatsCardsSkeleton />}>
            <StatsCardsSection />
          </Suspense>
        </div>

        {/* 최근 기록한 책 - 스트리밍 */}
        <Suspense fallback={<RecentBooksSkeleton />}>
          <RecentBooksSection />
        </Suspense>

        {/* 월별 통계 차트 - 스트리밍 */}
        <Suspense fallback={<MonthlyStatsSkeleton />}>
          <MonthlyStatsSection />
        </Suspense>

        {/* 최근 기록 - 스트리밍 */}
        <Suspense fallback={<RecentNotesSkeleton />}>
          <RecentNotesSection />
        </Suspense>

        {/* 가장 많이 기록한 책 - 스트리밍 */}
        <Suspense fallback={<TopBooksSkeleton />}>
          <TopBooksSection />
        </Suspense>

        {/* 서비스 소식 - 정적 (즉시 렌더링) */}
        <NewsSection />
      </div>
    </>
  );
}
