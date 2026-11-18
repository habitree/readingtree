import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidUUID } from "@/lib/utils/validation";
import { createOgAnonSupabaseClient, createOgServiceSupabaseClient } from "@/lib/og/utils";
import { buildShareMetadata, buildShareNotFoundMetadata } from "@/lib/og/meta";
import { ReferralTracker } from "@/components/share/referral-tracker";
import { YearlyStoryViewer } from "@/components/recap/yearly/yearly-story-viewer";
import { formatReadingTime } from "@/lib/recap/text";
import type { YearlyRecapComputed } from "@/lib/recap/yearly";

/**
 * 연간 독서결산 공개 공유 페이지 (share_id 토큰) — REQ-0014.
 * - 비로그인 가능 (anon 클라이언트, RLS의 is_public=true 통과)
 * - 비공개·존재하지 않음 → 404
 */

interface YearlyShareRow {
  user_id: string;
  year: number;
  stats: YearlyRecapComputed["stats"];
  highlights: YearlyRecapComputed["highlights"];
}

const fetchRecap = cache(async (shareId: string): Promise<YearlyShareRow | null> => {
  const supabase = createOgAnonSupabaseClient();
  const { data, error } = await supabase
    .from("yearly_recaps")
    .select("user_id, year, stats, highlights")
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();
  if (error || !data) return null;
  return data as unknown as YearlyShareRow;
});

const fetchUserName = cache(async (userId: string): Promise<string | null> => {
  const service = createOgServiceSupabaseClient();
  if (!service) return null;
  try {
    const { data } = await service.from("users").select("name").eq("id", userId).maybeSingle();
    return (data as { name: string | null } | null)?.name ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!id || !isValidUUID(id)) return buildShareNotFoundMetadata("yearly-recap");

  const recap = await fetchRecap(id);
  if (!recap) return buildShareNotFoundMetadata("yearly-recap");

  const name = await fetchUserName(recap.user_id);
  const ogTitle = `${name ? name + "님의 " : ""}${recap.year} 독서 결산`;
  const ogDescription = `${recap.highlights.personaTitle} · ${formatReadingTime(recap.stats.totalReadingSeconds)} · 완독 ${recap.stats.completedBooks}권`;

  return buildShareMetadata({
    kind: "yearly-recap",
    id,
    path: `/share/yearly-recaps/${id}`,
    ogTitle,
    ogDescription,
    pageTitle: `${recap.year} 독서 결산 | ReadTree`,
    alt: ogTitle,
  });
}

export default async function ShareYearlyRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || !isValidUUID(id)) notFound();

  const recap = await fetchRecap(id);
  if (!recap) notFound();

  const name = await fetchUserName(recap.user_id);
  const computed: YearlyRecapComputed = {
    year: recap.year,
    stats: recap.stats,
    highlights: recap.highlights,
    isEmpty: false,
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="text-stone-500 hover:text-emerald-700">
            <Link href="/">
              <ChevronLeft className="mr-1 h-4 w-4" />
              메인으로
            </Link>
          </Button>
        </div>

        <YearlyStoryViewer computed={computed} userName={name} share={null} />

        <div className="mx-auto mt-8 max-w-[420px] rounded-2xl border border-stone-100 bg-white px-6 py-6 text-center dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm text-stone-500">ReadTree에서 나만의 독서 결산을 만들어보세요</p>
          <Button asChild className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700">
            <Link href="/">나도 시작하기</Link>
          </Button>
        </div>

        <ReferralTracker />
      </div>
    </div>
  );
}
