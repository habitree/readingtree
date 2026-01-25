import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import DashboardContent from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "샘플 보기 | ReadTree",
  description: "ReadTree 서비스를 미리 체험해보세요",
};

/**
 * 샘플 페이지
 * - 로그인 사용자: 홈으로 리다이렉트
 * - 비로그인 사용자: 홈 대시보드와 동일한 샘플 화면 표시
 *
 * DashboardContent를 재사용하여 메인 페이지 업데이트 시 자동 반영
 */
export default async function SamplePage() {
  // 로그인 사용자는 홈으로 리다이렉트
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="container max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6 md:py-10">
      <DashboardContent />
    </div>
  );
}
