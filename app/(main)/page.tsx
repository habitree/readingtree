import DashboardContent from "@/components/dashboard/dashboard-content";

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

