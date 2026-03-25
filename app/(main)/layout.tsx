import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { ErrorBoundary } from "@/components/error-boundary";
import { QuickCaptureAdapter } from "@/components/notes/quick-capture-adapter";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { PageTracker } from "@/components/tracking/page-tracker";
import { MusicMiniPlayer } from "@/components/music/music-mini-player";

/**
 * 메인 레이아웃
 * 사이드바와 헤더를 포함하는 레이아웃
 * (main) 그룹의 모든 페이지에 적용됨
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      {/* 전역 네비게이션 프로그레스 바 */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 lg:pl-64 flex flex-col">
            <div className="flex-1">
              <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 pb-16 lg:pb-6">
                {children}
              </div>
            </div>
            <Footer />
          </main>
        </div>
        <MobileNav />
        <MusicMiniPlayer />
        <PageTracker />
        <QuickCaptureAdapter />
        <UpgradeModal />
      </div>
    </ErrorBoundary>
  );
}

