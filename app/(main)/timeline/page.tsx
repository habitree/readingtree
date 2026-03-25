import { redirect } from "next/navigation";

interface TimelinePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/**
 * 타임라인 페이지 → /notes?view=timeline으로 리다이렉트
 * 기존 URL 호환성을 위해 유지
 */
export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams({ view: "timeline" });

  if (sp.sort) params.set("sort", sp.sort);
  if (sp.page) params.set("page", sp.page);

  redirect(`/notes?${params.toString()}`);
}
