import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCachedCurrentUser } from "@/lib/cached";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LoginSuccessToast } from "./login-success-toast";

// Streaming SSR 섹션 컴포넌트
import {
  RecentBooksSection,
  HomeHeroWrapper,
  MobileQuickActions,
} from "./sections";

// 스켈레톤 컴포넌트
import {
  RecentBooksSkeleton,
  HomeHeroSkeleton,
} from "./skeletons";

// Tertiary Zone 컴포넌트
import { TertiaryZoneWrapper } from "./tertiary-zone-wrapper";

/**
 * 게스트 사용자 배너 (동기 렌더링)
 */
async function GuestBanner() {
  const user = await getCachedCurrentUser();
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
 * 5초 규칙 기반 정보 계층 구조:
 * - Primary Zone: 인사말 + 핵심 지표 + 주간 진행 바
 * - Secondary Zone: 계속 읽기 + 최근 진행 체크 (2열 그리드)
 * - Tertiary Zone: 활동 캘린더 + 최근 기록한 책 (접이식)
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

        {/* ======== PRIMARY + SECONDARY ZONE ======== */}
        {/* 홈 히어로 섹션 - 개인화 인사 + 핵심 지표 + 계속 읽기 + 진행 체크 */}
        <Suspense fallback={<HomeHeroSkeleton />}>
          <HomeHeroWrapper />
        </Suspense>

        {/* 모바일 퀵 액션 버튼 (로그인 사용자만) */}
        <Suspense fallback={null}>
          <AuthenticatedQuickActions />
        </Suspense>

        {/* ======== TERTIARY ZONE (접이식) ======== */}
        {/* 활동 캘린더, 최근 기록한 책, 페르소나 인사이트 */}
        <Suspense fallback={<TertiaryZoneSkeleton />}>
          <TertiaryZoneWrapper />
        </Suspense>
      </div>
    </>
  );
}

/**
 * 인증된 사용자만 퀵 액션 표시
 */
async function AuthenticatedQuickActions() {
  const user = await getCachedCurrentUser();
  if (!user) return null;
  return <MobileQuickActions />;
}

/**
 * Tertiary Zone 스켈레톤
 */
function TertiaryZoneSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
