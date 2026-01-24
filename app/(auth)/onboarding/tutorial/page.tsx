import { redirect } from "next/navigation";

/**
 * 온보딩 튜토리얼 페이지 (레거시)
 * 프로그레시브 온보딩 위저드로 리다이렉트
 */
export default function TutorialPage() {
  redirect("/onboarding");
}

