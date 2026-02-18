import { redirect } from "next/navigation";

/**
 * 샘플 페이지 → 홈으로 리다이렉트
 * 게스트 경험이 메인과 동일해졌으므로 별도 샘플 페이지 불필요
 */
export default function SamplePage() {
  redirect("/");
}
