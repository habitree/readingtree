import { redirect } from "next/navigation";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * 검색 페이지 → /notes로 리다이렉트
 * 기존 URL 호환성을 위해 유지
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();

  if (sp.q) params.set("q", sp.q);
  if (sp.bookId) params.set("bookId", sp.bookId);
  if (sp.startDate) params.set("startDate", sp.startDate);
  if (sp.endDate) params.set("endDate", sp.endDate);
  if (sp.tags) params.set("tags", sp.tags);
  if (sp.types) {
    // types → tab 매핑 (단일 타입이면 탭으로)
    const types = sp.types.split(",");
    if (types.length === 1) {
      params.set("tab", types[0]);
    }
  }
  if (sp.page) params.set("page", sp.page);

  const qs = params.toString();
  redirect(qs ? `/notes?${qs}` : "/notes");
}
