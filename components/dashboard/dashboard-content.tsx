import { Suspense } from "react";
import { getCachedCurrentUser } from "@/lib/cached";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { LoginSuccessToast } from "./login-success-toast";

// Streaming SSR 섹션 컴포넌트
import {
  RecentBooksSection,
  HomeHeroWrapper,
  MobileQuickActions,
  MonthlyBookCalendarSkeleton,
} from "./sections";

// 스켈레톤 컴포넌트
import {
  RecentBooksSkeleton,
  HomeHeroSkeleton,
} from "./skeletons";

// Tertiary Zone 컴포넌트
import { TertiaryZoneWrapper } from "./tertiary-zone-wrapper";

/**
 * 게스트 사용자 미니 인라인 배너
 */
async function GuestBanner() {
  const user = await getCachedCurrentUser();
  if (user) return null;

  return (
    <Link href="/login" className="block">
      <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground">ReadTree를 체험 중이에요</span>
        </div>
        <span className="text-sm font-medium text-primary shrink-0">로그인</span>
      </div>
    </Link>
  );
}

/**
 * 대시보드 컨텐츠 컴포넌트 (Streaming SSR)
 *
 * 5초 규칙 기반 정보 계층 구조:
 * - Primary Zone: 인사말 + 핵심 지표 + 주간 진행 바
 * - Secondary Zone: 계속 읽기 + 최근 진행 체크 (2열 그리드)
 * - Tertiary Zone: 활동 캘린더 + 최근 기록한 책 (데스크톱: 우측 컬럼, 모바일: 접이식)
 */
export default async function DashboardContent() {
  return (
    <>
      {/* 로그인 성공 메시지 (클라이언트 컴포넌트) */}
      <LoginSuccessToast />

      {/* 게스트 배너 - 즉시 로드 */}
      <Suspense fallback={null}>
        <GuestBanner />
      </Suspense>

      {/* 2컬럼 레이아웃: 좌측 메인 + 우측 Tertiary */}
      <div className="mt-4 lg:grid lg:grid-cols-[1fr_340px] lg:gap-5 xl:grid-cols-[1fr_400px] xl:gap-6">
        {/* 좌측 컬럼: Primary + Secondary + QuickActions */}
        <div className="space-y-4">
          {/* ======== PRIMARY + SECONDARY ZONE ======== */}
          <Suspense fallback={<HomeHeroSkeleton />}>
            <HomeHeroWrapper />
          </Suspense>

          {/* 퀵 액션 버튼 (모바일+데스크톱) */}
          <Suspense fallback={null}>
            <AuthenticatedQuickActions />
          </Suspense>
        </div>

        {/* 우측 컬럼: Tertiary Zone */}
        <div className="mt-4 lg:mt-0">
          <Suspense fallback={<TertiaryZoneSkeleton />}>
            <TertiaryZoneWrapper />
          </Suspense>
        </div>
      </div>
    </>
  );
}

/**
 * 퀵 액션 표시 (로그인/게스트 공통, 게스트는 클릭 시 로그인 유도)
 */
async function AuthenticatedQuickActions() {
  return <MobileQuickActions />;
}

/**
 * Tertiary Zone 스켈레톤
 */
function TertiaryZoneSkeleton() {
  return (
    <div className="space-y-4">
      {/* 모바일: 접이식 헤더 스켈레톤 */}
      <div className="lg:hidden">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      {/* 데스크톱: 캘린더 스켈레톤 */}
      <div className="hidden lg:block space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>
        <MonthlyBookCalendarSkeleton />
      </div>
    </div>
  );
}
