import type { Metadata } from "next";
import DashboardContent from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "홈",
  description: "나만의 독서 대시보드 - 읽고 있는 책, 기록, 독서 통계를 한눈에 확인하세요",
};

/**
 * 메인 페이지 (대시보드)
 * 로그인 사용자에게는 개인화된 대시보드를, 비로그인 사용자에게는 샘플 데이터 대시보드를 표시합니다.
 */
export default function HomePage() {
  return (
    <div className="container max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-8">
      <DashboardContent />
    </div>
  );
}

