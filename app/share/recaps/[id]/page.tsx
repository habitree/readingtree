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
import { RecapView } from "@/components/recap/recap-view";
import type { RecapStats, RecapHighlights, RecapComputed } from "@/app/actions/recap/types";

/**
 * 월간 독서결산 공개 공유 페이지 (share_id 토큰).
 * - 비로그인 가능 (anon 클라이언트, RLS의 is_public=true 통과)
 * - 비공개·존재하지 않음 → 404
 */

interface RecapShareRow {
  user_id: string;
  year: number;
  month: number;
  stats: RecapStats;
  highlights: RecapHighlights;
  ai_caption: string | null;
}

const fetchRecap = cache(async (shareId: string): Promise<RecapShareRow | null> => {
  const supabase = createOgAnonSupabaseClient();
  const { data, error } = await supabase
    .from("monthly_recaps")
    .select("user_id, year, month, stats, highlights, ai_caption")
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();
  if (error || !data) return null;
  return data as unknown as RecapShareRow;
});

const fetchUserDisplay = cache(async (userId: string): Promise<{ name: string | null } | null> => {
  const service = createOgServiceSupabaseClient();
  if (!service) return null;
  try {
    const { data } = await service.from("users").select("name").eq("id", userId).maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
});

function toComputed(row: RecapShareRow): RecapComputed {
  const s = row.stats;
  return {
    year: row.year,
    month: row.month,
    stats: s,
    highlights: row.highlights,
    isEmpty: s.totalNotes === 0 && s.sessionCount === 0 && s.completedBooks === 0,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!id || !isValidUUID(id)) return buildShareNotFoundMetadata("recap");

  const recap = await fetchRecap(id);
  if (!recap) return buildShareNotFoundMetadata("recap");

  const user = await fetchUserDisplay(recap.user_id);
  const name = user?.name ?? null;
  const persona = recap.highlights.personaTitle;
  const ogTitle = `${name ? name + "님의 " : ""}${recap.year}년 ${recap.month}월 독서결산`;
  const ogDescription =
    recap.ai_caption ?? `${persona} · 완독 ${recap.stats.completedBooks}권 · 기록 ${recap.stats.totalNotes}개`;

  return buildShareMetadata({
    kind: "recap",
    id,
    path: `/share/recaps/${id}`,
    ogTitle,
    ogDescription,
    pageTitle: `${recap.year}년 ${recap.month}월 독서결산 | ReadTree`,
    alt: ogTitle,
  });
}

export default async function ShareRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || !isValidUUID(id)) notFound();

  const recap = await fetchRecap(id);
  if (!recap) notFound();

  const computed = toComputed(recap);

  return (
    <div className="min-h-screen bg-stone-50 selection:bg-emerald-500/20 dark:bg-stone-950">
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* 상단 액션 바 */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="text-stone-500 hover:text-emerald-700">
            <Link href="/">
              <ChevronLeft className="mr-1 h-4 w-4" />
              메인으로
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:border-stone-800 dark:bg-stone-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Monthly Recap
          </div>
        </div>

        {/* 결산 본문 (읽기전용) */}
        <RecapView computed={computed} aiCaption={recap.ai_caption} readOnly />

        {/* CTA */}
        <div className="mt-8 rounded-2xl border border-stone-100 bg-white px-6 py-6 text-center shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <p className="text-sm text-stone-500">ReadTree에서 나만의 월간 독서결산을 만들어보세요</p>
          <Button asChild className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700">
            <Link href="/">나도 시작하기</Link>
          </Button>
        </div>

        <ReferralTracker />
      </div>
    </div>
  );
}
