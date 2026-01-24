import { redirect } from "next/navigation";

/**
 * 독서 목표 설정 페이지 (레거시)
 * 프로그레시브 온보딩 위저드로 리다이렉트
 */
export default function GoalSettingPage() {
  redirect("/onboarding");
}

