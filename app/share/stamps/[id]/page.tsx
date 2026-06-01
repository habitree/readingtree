import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, BookOpen, Clock, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isValidUUID } from "@/lib/utils/validation";
import { createOgAnonSupabaseClient, createOgServiceSupabaseClient } from "@/lib/og/utils";
import { buildShareMetadata, buildShareNotFoundMetadata } from "@/lib/og/meta";
import { ReferralTracker } from "@/components/share/referral-tracker";
import { PhotoGallery } from "@/components/stamps/photo-gallery";

/**
 * 스탬프 공개 공유 페이지.
 * - 비로그인 가능 (anon 클라이언트, RLS의 is_public=true 정책 통과)
 * - 비공개·존재하지 않음 → 404
 *
 * 노트 공유 페이지(`app/share/notes/[id]/page.tsx`)와 디자인 톤 일치.
 */

interface StampShareData {
  id: string;
  user_id: string;
  is_public: boolean;
  image_url: string | null;
  image_urls: string[] | null;
  start_page: number | null;
  end_page: number | null;
  started_at: string | null;
  ended_at: string | null;
  reading_duration_seconds: number;
  pace_seconds_per_page: number | null;
  memo: string | null;
  created_at: string;
  user_books?: {
    books?: {
      id: string;
      title: string;
      author: string | null;
      cover_image_url: string | null;
      total_pages: number | null;
    } | null;
  } | null;
}

// generateMetadata + 페이지 렌더에서 각각 호출되므로 cache()로 동일 요청 내 DB 중복 호출 제거
const fetchStamp = cache(async (logId: string): Promise<StampShareData | null> => {
  const supabase = createOgAnonSupabaseClient();
  const { data, error } = await supabase
    .from("reading_logs")
    .select(
      `
      id,
      user_id,
      is_public,
      image_url,
      image_urls,
      start_page,
      end_page,
      started_at,
      ended_at,
      reading_duration_seconds,
      pace_seconds_per_page,
      memo,
      created_at,
      user_books!inner (
        books (
          id,
          title,
          author,
          cover_image_url,
          total_pages
        )
      )
    `,
    )
    .eq("id", logId)
    .eq("is_public", true)
    .single();

  if (error || !data) return null;
  return data as unknown as StampShareData;
});

const fetchUserDisplay = cache(async (userId: string): Promise<{ name: string | null; avatar_url: string | null } | null> => {
  const service = createOgServiceSupabaseClient();
  if (!service) return null;
  try {
    const { data } = await service
      .from("users")
      .select("name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const resolved = await params;
  const id = resolved.id;
  if (!id || !isValidUUID(id)) {
    return buildShareNotFoundMetadata("stamp");
  }

  const stamp = await fetchStamp(id);
  if (!stamp) {
    return buildShareNotFoundMetadata("stamp");
  }

  const book = stamp.user_books?.books ?? null;
  const cleanTitle = (book?.title ?? "독서 기록").replace(/\s*\(.*?\)\s*$/, "").trim();

  const minutes = Math.round(stamp.reading_duration_seconds / 60);
  const pages = Math.max(0, (stamp.end_page ?? 0) - (stamp.start_page ?? 0));
  const summary =
    minutes > 0 || pages > 0
      ? `${minutes > 0 ? `${minutes}분 · ` : ""}${pages > 0 ? `${pages}p` : "1세션"}`
      : "독서 스탬프";

  let userName: string | null = null;
  if (stamp.user_id) {
    const u = await fetchUserDisplay(stamp.user_id);
    userName = u?.name ?? null;
  }

  const ogDescription = stamp.memo
    ? `"${stamp.memo}"`
    : `${cleanTitle} · ${summary}`;

  const ogTitle = userName
    ? `${userName}님의 ${cleanTitle} 스탬프`
    : `${cleanTitle} 독서 스탬프`;

  return buildShareMetadata({
    kind: "stamp",
    id: stamp.id,
    path: `/share/stamps/${stamp.id}`,
    ogTitle,
    ogDescription,
    pageTitle: `${cleanTitle} - 독서 스탬프 | ReadTree`,
    alt: `${cleanTitle} 독서 스탬프`,
  });
}

function formatDuration(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

function formatPace(secondsPerPage: number): string {
  const total = Math.max(0, Math.round(secondsPerPage));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m > 0) return `${m}분 ${s}초/p`;
  return `${s}초/p`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}.${mo}.${da}`;
}

export default async function ShareStampPage({
  params,
}: {
  params: { id: string };
}) {
  const resolved = await params;
  const id = resolved.id;
  if (!id || !isValidUUID(id)) notFound();

  const stamp = await fetchStamp(id);
  if (!stamp) notFound();

  const book = stamp.user_books?.books ?? null;
  const userInfo = stamp.user_id ? await fetchUserDisplay(stamp.user_id) : null;

  const pages = Math.max(0, (stamp.end_page ?? 0) - (stamp.start_page ?? 0));
  const minutes = Math.round(stamp.reading_duration_seconds / 60);
  const photos: string[] =
    Array.isArray(stamp.image_urls) && stamp.image_urls.length > 0
      ? stamp.image_urls
      : stamp.image_url
        ? [stamp.image_url]
        : [];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 selection:bg-emerald-500/20">
      <div className="container mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* 상단 액션 바 */}
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-stone-500 hover:text-emerald-700"
          >
            <Link href="/">
              <ChevronLeft className="mr-1 h-4 w-4" />
              메인으로
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:border-stone-800 dark:bg-stone-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Public Stamp
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-md dark:bg-stone-900">
          {/* 헤더: 책 + 사용자 */}
          <div className="flex items-start gap-4 border-b border-stone-100 px-6 pt-6 pb-5 dark:border-stone-800">
            {book?.cover_image_url ? (
              <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-md bg-stone-200 shadow-sm">
                <Image
                  src={book.cover_image_url}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-24 w-16 flex-shrink-0 items-center justify-center rounded-md bg-stone-200">
                <BookOpen className="h-6 w-6 text-stone-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-tight">{book?.title ?? "제목 미상"}</p>
              {book?.author && (
                <p className="mt-1 text-sm text-stone-500">{book.author}</p>
              )}
              <p className="mt-2 text-xs text-stone-400 tabular-nums">
                {formatDate(stamp.created_at)}
              </p>
            </div>
            {userInfo && (
              <div className="flex flex-col items-end gap-1.5">
                {userInfo.avatar_url ? (
                  <div className="relative h-9 w-9 overflow-hidden rounded-full bg-stone-200 ring-2 ring-white">
                    <Image
                      src={userInfo.avatar_url}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {(userInfo.name ?? "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                {userInfo.name && (
                  <span className="max-w-[120px] truncate text-xs text-stone-600">
                    {userInfo.name}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 사진 갤러리 — 대표 + 썸네일 스트립 + 라이트박스 */}
          {photos.length > 0 && (
            <div className="px-4 pt-4 pb-2 sm:px-6">
              <PhotoGallery
                urls={photos}
                alt={book?.title ? `${book.title} 스탬프 사진` : "스탬프 사진"}
                coverAspect={photos.length === 1 ? "video" : "square"}
              />
            </div>
          )}

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-3 px-6 py-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-500">
                <Timer className="h-3 w-3 text-emerald-600" />
                <span>독서 시간</span>
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums">
                {formatDuration(stamp.reading_duration_seconds)}
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-500">
                <BookOpen className="h-3 w-3 text-emerald-600" />
                <span>페이지</span>
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums">
                {pages > 0 ? `${pages}p` : `${stamp.end_page ?? 0}p`}
              </div>
              {pages > 0 && (
                <div className="text-[10px] text-stone-400 tabular-nums">
                  {stamp.start_page} → {stamp.end_page}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-stone-500">
                <Clock className="h-3 w-3 text-emerald-600" />
                <span>{stamp.pace_seconds_per_page ? "페이스" : "분당"}</span>
              </div>
              <div className="mt-1 text-lg font-bold tabular-nums">
                {stamp.pace_seconds_per_page
                  ? formatPace(stamp.pace_seconds_per_page)
                  : `${minutes}분`}
              </div>
            </div>
          </div>

          {/* 메모 */}
          {stamp.memo && (
            <div className="border-t border-stone-100 px-6 py-5 dark:border-stone-800">
              <p className="border-l-2 border-emerald-300 pl-3 italic text-stone-700 dark:text-stone-300">
                {stamp.memo}
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-stone-100 bg-stone-50 px-6 py-5 text-center dark:border-stone-800 dark:bg-stone-900/40">
            <p className="text-xs text-stone-500">
              ReadTree에서 나만의 독서 스탬프를 모아보세요
            </p>
            <Button
              asChild
              className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Link href="/">시작하기</Link>
            </Button>
          </div>
        </div>

        {/* ref 트래커 */}
        <ReferralTracker />
      </div>
    </div>
  );
}
