import { redirect } from "next/navigation";

/**
 * 독서 성향 대시보드 페이지 → /stats 로 통합됨
 */
export default async function PersonaPage() {
  redirect("/stats");
}
