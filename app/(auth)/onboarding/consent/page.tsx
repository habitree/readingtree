import { redirect } from "next/navigation";

/**
 * 약관 동의 페이지 (레거시)
 * 프로그레시브 온보딩 위저드로 리다이렉트
 */
export default function ConsentPage() {
  redirect("/onboarding");
}

