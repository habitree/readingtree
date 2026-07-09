import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  Timer,
  CalendarDays,
  Layers,
  FileText,
  Sparkles,
  Camera,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { isValidUUID } from "@/lib/utils/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { buildShareMetadata, buildShareNotFoundMetadata } from "@/lib/og/meta";
import { summarizeReadingTime } from "@/lib/reading/time-stats";
import { ReferralTracker } from "@/components/share/referral-tracker";

/**
 * 독서 시간 공개 공유 페이지 (신규 — 2026-07-09).
 *
 * 책 상세 "독서 시간" 탭의 [공유] 버튼이 이 URL을 복사/전송한다.
 * 로그인 없이 누구나 열람 가능 — 완독 공유 카드(`app/share/completions`)와
 * 동일하게 admin(service_role) 클라이언트로 userBookId 링크만으로 공개 조회한다
 * (별도 is_public 토글·RLS 정책 불필요, 링크 = 의도된 공개).
 *
 * 디자인: 다크 오로라 히어로(공유 이미지 카드와 브랜드 톤 일치) + 통계 타일 +
 * 최근 세션 타임라인 + 가입 CTA. "자랑하고 싶은" 대시보드형 랜딩.
 */

interface LogRow {
  reading_duration_seconds: number;
  start_page: number | null;
  end_page: number | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  image_url: string | null;
}

interface ReadingTimeShareData {
  userBookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  bookCoverUrl: string | null;
  totalPages: number | null;
  ownerName: string | null;
  ownerAvatarUrl: string | null;
  logs: LogRow[];
}

// generateMetadata + 페이지 렌더에서 각각 호출되므로 cache()로 요청 내 DB 중복 조회 제거
const fetchReadingTimeShare = cache(
  async (userBookId: string): Promise<ReadingTimeShareData | null> => {
    if (!isValidUUID(userBookId)) return null;
    try {
      const supabase = createAdminSupabaseClient();

      const { data: userBook, error } = await supabase
        .from("user_books")
        .select("id, user_id, books(title, author, cover_image_url, total_pages)")
        .eq("id", userBookId)
        .maybeSingle();

      if (error || !userBook) return null;

      const booksField = (
        userBook as unknown as {
          books:
            | {
                title: string;
                author: string | null;
                cover_image_url: string | null;
                total_pages: number | null;
              }
            | {
                title: string;
                author: string | null;
                cover_image_url: string | null;
                total_pages: number | null;
              }[]
            | null;
        }
      ).books;
      const book = Array.isArray(booksField) ? booksField[0] ?? null : booksField;
      if (!book) return null;

      const { data: logsData } = await supabase
        .from("reading_logs")
        .select(
          "reading_duration_seconds, start_page, end_page, created_at, started_at, ended_at, image_url",
        )
        .eq("user_book_id", userBookId)
        .gt("reading_duration_seconds", 0)
        .order("created_at", { ascending: false });

      const logs = (logsData ?? []) as LogRow[];

      let ownerName: string | null = null;
      let ownerAvatarUrl: string | null = null;
      const ownerId = (userBook as { user_id: string | null }).user_id;
      if (ownerId) {
        const { data: owner } = await supabase
          .from("users")
          .select("name, avatar_url")
          .eq("id", ownerId)
          .maybeSingle();
        ownerName = owner?.name ?? null;
        ownerAvatarUrl = owner?.avatar_url ?? null;
      }

      return {
        userBookId,
        bookTitle: book.title || "제목 없음",
        bookAuthor: book.author,
        bookCoverUrl: book.cover_image_url,
        totalPages: book.total_pages,
        ownerName,
        ownerAvatarUrl,
        logs,
      };
    } catch {
      return null;
    }
  },
);

interface DerivedStats {
  totalSeconds: number;
  sessionCount: number;
  averageSeconds: number;
  maxSessionSeconds: number;
  totalPagesRead: number;
  readingDays: number;
  stampCount: number;
  progressPct: number | null;
  firstDate: string | null;
  lastDate: string | null;
}

function deriveStats(data: ReadingTimeShareData): DerivedStats {
  const summary = summarizeReadingTime(data.logs);

  const totalPagesRead = data.logs.reduce((sum, l) => {
    const sp = typeof l.start_page === "number" ? l.start_page : 0;
    const ep = typeof l.end_page === "number" ? l.end_page : sp;
    return sum + Math.max(0, ep - sp);
  }, 0);

  const maxSessionSeconds = data.logs.reduce(
    (max, l) => Math.max(max, l.reading_duration_seconds || 0),
    0,
  );
  const readingDays = new Set(data.logs.map((l) => l.created_at.slice(0, 10))).size;
  const stampCount = data.logs.filter((l) => !!l.image_url).length;
  const progressPct =
    data.totalPages && totalPagesRead > 0
      ? Math.min(100, Math.round((totalPagesRead / data.totalPages) * 100))
      : null;

  const dates = data.logs.map((l) => l.created_at).sort();
  const firstDate = dates[0] ?? null;
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;

  return {
    totalSeconds: summary.totalSeconds,
    sessionCount: summary.sessionCount,
    averageSeconds: summary.averageSeconds,
    maxSessionSeconds,
    totalPagesRead,
    readingDays,
    stampCount,
    progressPct,
    firstDate,
    lastDate,
  };
}

function fmtDuration(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

/** 히어로 표기 — 숫자/단위 분리 렌더 */
function heroParts(s: number): { num: string; unit: string }[] {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0)
    return [
      { num: String(h), unit: "시간" },
      { num: String(m), unit: "분" },
    ];
  if (h > 0) return [{ num: String(h), unit: "시간" }];
  if (m > 0) return [{ num: String(m), unit: "분" }];
  return [{ num: "1", unit: "분 미만" }];
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}.${mo}.${da}`;
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso);
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${mo}.${da}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userBookId: string }>;
}): Promise<Metadata> {
  const { userBookId } = await params;
  if (!userBookId || !isValidUUID(userBookId)) {
    return buildShareNotFoundMetadata("reading-time");
  }

  const data = await fetchReadingTimeShare(userBookId);
  if (!data) return buildShareNotFoundMetadata("reading-time");

  const stats = deriveStats(data);
  const ownerLabel = data.ownerName ? `${data.ownerName}님이 ` : "";
  const ogTitle = `${ownerLabel}${data.bookTitle} ${fmtDuration(stats.totalSeconds)} 독서`;
  const ogDescription =
    stats.sessionCount > 0
      ? `${fmtDuration(stats.totalSeconds)} · ${stats.sessionCount}세션${
          stats.totalPagesRead > 0 ? ` · ${stats.totalPagesRead}p` : ""
        } — ReadTree에서 나의 독서 시간도 기록해보세요.`
      : "ReadTree에서 나의 독서 시간을 기록하고 공유해보세요.";

  return buildShareMetadata({
    kind: "reading-time",
    id: userBookId,
    path: `/share/reading-time/${userBookId}`,
    ogTitle,
    ogDescription,
    pageTitle: `${data.bookTitle} 독서 시간 | ReadTree`,
    alt: `${data.bookTitle} 독서 시간 카드`,
  });
}

export default async function SharedReadingTimePage({
  params,
}: {
  params: Promise<{ userBookId: string }>;
}) {
  const { userBookId } = await params;
  if (!userBookId || !isValidUUID(userBookId)) notFound();

  const data = await fetchReadingTimeShare(userBookId);
  if (!data) notFound();

  const stats = deriveStats(data);
  const hero = heroParts(stats.totalSeconds);
  const recentSessions = data.logs.slice(0, 6);

  const initial = (data.ownerName ?? "R").slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060d0b] selection:bg-emerald-500/20">
      <ReferralTracker />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {/* 상단 액션 바 */}
        <div className="mb-5 flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="gap-1.5 text-slate-500">
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
              ReadTree
            </Link>
          </Button>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Reading Time
          </div>
        </div>

        {/* ── 히어로 (다크 오로라, 공유 이미지 카드와 톤 일치) ── */}
        <section
          className="relative overflow-hidden rounded-[28px] p-6 text-white shadow-xl sm:p-8"
          style={{
            backgroundColor: "#081311",
            backgroundImage:
              "radial-gradient(620px 460px at 88% -12%, rgba(16,185,129,0.34), transparent 60%)," +
              "radial-gradient(460px 400px at -10% 110%, rgba(45,212,191,0.14), transparent 60%)," +
              "linear-gradient(160deg, #0b1a16 0%, #091320 55%, #0a1815 100%)",
          }}
        >
          {/* 소유자 */}
          <div className="flex items-center gap-2.5">
            {data.ownerAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.ownerAvatarUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-200 ring-2 ring-white/10">
                {initial}
              </div>
            )}
            <p className="text-sm text-slate-300">
              {data.ownerName ? (
                <>
                  <span className="font-semibold text-white">{data.ownerName}</span>
                  <span className="text-slate-400">님의 독서 기록</span>
                </>
              ) : (
                <span className="text-slate-400">누군가의 독서 기록</span>
              )}
            </p>
          </div>

          {/* 책 + 총 시간 */}
          <div className="mt-6 flex items-start gap-5">
            <div className="relative shrink-0">
              <div
                className="absolute -inset-5"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(16,185,129,0.4), transparent)",
                }}
              />
              {data.bookCoverUrl ? (
                <div className="relative h-[150px] w-[104px] overflow-hidden rounded-xl ring-1 ring-white/20 sm:h-[168px] sm:w-[116px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.bookCoverUrl}
                    alt={data.bookTitle}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(125deg, rgba(255,255,255,0.16) 0%, transparent 42%, rgba(0,0,0,0.16) 100%)",
                    }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 w-[6px]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, transparent 100%)",
                    }}
                  />
                </div>
              ) : (
                <div className="flex h-[150px] w-[104px] items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/15 sm:h-[168px] sm:w-[116px]">
                  <BookOpen className="h-10 w-10 text-emerald-300" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
                {stats.progressPct === 100 ? "Finished" : "Now Reading"}
              </p>
              <h1 className="mt-1.5 line-clamp-3 text-xl font-bold leading-snug sm:text-2xl">
                {data.bookTitle}
              </h1>
              {data.bookAuthor && (
                <p className="mt-1 line-clamp-1 text-sm text-slate-400">{data.bookAuthor}</p>
              )}

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  총 독서 시간
                </p>
                <div className="mt-1 flex flex-wrap items-baseline">
                  {hero.map((part, i) => (
                    <span key={i} className="flex items-baseline">
                      <span className="text-[42px] font-extrabold leading-none tracking-tighter tabular-nums sm:text-[52px]">
                        {part.num}
                      </span>
                      <span
                        className={
                          "ml-1 text-lg font-bold leading-none text-emerald-300 sm:text-xl" +
                          (i < hero.length - 1 ? " mr-3" : "")
                        }
                      >
                        {part.unit}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 진행률 */}
          {stats.progressPct !== null && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span>읽기 진행률</span>
                <span className="tabular-nums text-emerald-300">
                  {stats.progressPct}%
                  {data.totalPages ? (
                    <span className="ml-1 text-slate-500">
                      · {stats.totalPagesRead}/{data.totalPages}p
                    </span>
                  ) : null}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${stats.progressPct}%`,
                    backgroundImage: "linear-gradient(90deg, #34d399 0%, #2dd4bf 100%)",
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* ── 통계 타일 (4종 중복 없이) ── */}
        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={<Layers className="h-4 w-4" />}
            label="세션"
            value={String(stats.sessionCount)}
            unit="회"
          />
          <StatTile
            icon={<Timer className="h-4 w-4" />}
            label="평균 / 회"
            value={fmtDuration(stats.averageSeconds)}
          />
          <StatTile
            icon={<CalendarDays className="h-4 w-4" />}
            label="독서한 날"
            value={String(stats.readingDays)}
            unit="일"
          />
          {stats.totalPagesRead > 0 ? (
            <StatTile
              icon={<FileText className="h-4 w-4" />}
              label="읽은 페이지"
              value={String(stats.totalPagesRead)}
              unit="p"
            />
          ) : (
            <StatTile
              icon={<TrendingUp className="h-4 w-4" />}
              label="최장 세션"
              value={fmtDuration(stats.maxSessionSeconds)}
            />
          )}
        </section>

        {/* ── 독서 여정 요약 ── */}
        {stats.firstDate && stats.lastDate && (
          <section className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              독서 기간
            </span>
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {fmtDate(stats.firstDate)}
              {stats.firstDate !== stats.lastDate && ` – ${fmtDate(stats.lastDate)}`}
            </span>
            {stats.stampCount > 0 && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Camera className="h-3.5 w-3.5" />
                스탬프 {stats.stampCount}
              </span>
            )}
          </section>
        )}

        {/* ── 최근 세션 타임라인 ── */}
        {recentSessions.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-slate-400">
              최근 세션
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {recentSessions.map((log, i) => {
                const pages =
                  typeof log.end_page === "number" && typeof log.start_page === "number"
                    ? Math.max(0, log.end_page - log.start_page)
                    : 0;
                return (
                  <div
                    key={`${log.created_at}-${i}`}
                    className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800/70"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {log.image_url ? (
                        <Camera className="h-4 w-4" />
                      ) : (
                        <Timer className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {fmtDuration(log.reading_duration_seconds)}
                        {pages > 0 && (
                          <span className="ml-2 text-xs font-normal text-slate-400 tabular-nums">
                            {pages}p
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 tabular-nums">
                      {fmtDateShort(log.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-500 p-6 text-white shadow-md dark:border-emerald-900 sm:p-7">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-50">
            <Sparkles className="h-3.5 w-3.5" />
            Start Reading
          </div>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl">
            나의 독서 시간도 기록해볼까요?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-emerald-50">
            ReadTree는 읽은 시간·페이지·스탬프를 모아 나만의 독서 기록으로 만들어줘요.
            지금 가입하면 웰컴 포인트 200P를 드려요.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="lg" className="font-bold">
              <Link href="/signup">무료로 시작하기</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="text-white hover:bg-white/10"
            >
              <Link href="/">둘러보기</Link>
            </Button>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          🌳 매일의 독서가 나무가 됩니다 · ReadTree
        </p>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 text-slate-400">
        <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold text-slate-800 tabular-nums dark:text-slate-100">
        {value}
        {unit && <span className="ml-0.5 text-sm font-semibold text-slate-400">{unit}</span>}
      </p>
    </div>
  );
}
