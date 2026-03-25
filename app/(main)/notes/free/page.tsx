import { redirect } from "next/navigation";

/**
 * /notes/free → /notes?free=true 리다이렉트
 * 기존 URL 호환성 유지
 */
export default async function FreeNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; source?: string }>;
}) {
  const params = await searchParams;
  const urlParams = new URLSearchParams();
  urlParams.set("free", "true");
  if (params.type) urlParams.set("type", params.type);
  if (params.source) urlParams.set("source", params.source);
  redirect(`/notes?${urlParams.toString()}`);
}
