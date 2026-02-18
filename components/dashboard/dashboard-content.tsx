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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
