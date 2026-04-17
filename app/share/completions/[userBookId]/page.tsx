import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Trophy, Sparkles } from "lucide-react";

import { getAppUrl } from "@/lib/utils/url";
import { isValidUUID } from "@/lib/utils/validation";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ReferralTracker } from "@/components/share/referral-tracker";

type CompletionPublicData = {
  bookTitle: string;
  bookAuthor: string | null;
  bookCoverUrl: string | null;
  completedAt: string | null;
  startedAt: string | null;
  readCount: number;
  ownerName: string | null;
};

async function getPublicCompletion(userBookId: string): Promise<CompletionPublicData | null> {
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase
      .from("user_books")
      .select(
        "status, completed_at, completed_dates, started_at, user_id, books(title, author, cover_image_url)",
      )
      .eq("id", userBookId)
      .eq("status", "completed")
      .maybeSingle();

    if (error || !data) return null;

    const booksField = (data as unknown as {
      books:
        | { title: string; author: string | null; cover_image_url: string | null }
        | { title: string; author: string | null; cover_image_url: string | null }[]
        | null;
    }).books;
    const book = Array.isArray(booksField) ? booksField[0] ?? null : booksField;
    if (!book) return null;

    const completedDates = Array.isArray(data.completed_dates) ? data.completed_dates : [];
    const readCount = Math.max(completedDates.length, data.completed_at ? 1 : 0);

    let ownerName: string | null = null;
    if (data.user_id) {
      const { data: owner } = await supabase
        .from("users")
        .select("name")
        .eq("id", data.user_id)
        .maybeSingle();
      ownerName = owner?.name ?? null;
    }

    return {
      bookTitle: book.title || "제목 없음",
      bookAuthor: book.author,
      bookCoverUrl: book.cover_image_url,
      completedAt: data.completed_at,
      startedAt: data.started_at,
      readCount,
      ownerName,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userBookId: string }>;
}): Promise<Metadata> {
  const { userBookId } = await params;

  if (!userBookId || !isValidUUID(userBookId)) {
    return { title: "완독 기록을 찾을 수 없습니다" };
  }

  const completion = await getPublicCompletion(userBookId);
  if (!completion) {
    return { title: "완독 기록을 찾을 수 없습니다" };
  }

  const baseUrl = getAppUrl();
  const shareUrl = `${baseUrl}/share/completions/${userBookId}`;
  const ogImageUrl = `${baseUrl}/share/completions/${userBookId}/opengraph-image`;
  const title =
    completion.readCount > 1
      ? `${completion.bookTitle} — ${completion.readCount}회독 완독!`
      : `${completion.bookTitle} 완독했어요`;
  const description = completion.bookAuthor
    ? `${completion.bookAuthor}의 책을 다 읽었어요. 나의 독서 기록도 ReadTree에서 시작해보세요.`
    : "한 권의 책을 다 읽었어요. 나의 독서 기록도 ReadTree에서 시작해보세요.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: shareUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${completion.bookTitle} 완독 카드`,
        },
      ],
      siteName: "Habitree",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default async function SharedCompletionPage({
  params,
}: {
  params: Promise<{ userBookId: string }>;
}) {
  const { userBookId } = await params;

  if (!userBookId || !isValidUUID(userBookId)) {
    notFound();
  }

  const completion = await getPublicCompletion(userBookId);
  if (!completion) {
    notFound();
  }

  const completedDateText = formatDate(completion.completedAt);
  const startedDateText = formatDate(completion.startedAt);

  let readingDaysText: string | null = null;
  if (completion.startedAt && completion.completedAt) {
    const startMs = new Date(completion.startedAt).getTime();
    const endMs = new Date(completion.completedAt).getTime();
    const diffDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
    readingDaysText = `${diffDays}일`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-amber-50 dark:from-emerald-950/40 dark:via-background dark:to-amber-950/40">
      <ReferralTracker />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="gap-1.5">
            <Link href="/">
              <ChevronLeft className="h-4 w-4" />
              ReadTree 홈
            </Link>
          </Button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 text-white shadow-md">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                <span>Reading Complete</span>
              </div>
              <h1 className="mt-0.5 text-2xl font-bold text-foreground sm:text-3xl">
                {completion.readCount > 1
                  ? `${completion.readCount}회독 완독!`
                  : "완독을 축하합니다"}
              </h1>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center">
              {completion.bookCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={completion.bookCoverUrl}
                  alt={completion.bookTitle}
                  className="h-48 w-32 rounded-md border border-slate-200 object-cover shadow-md dark:border-slate-700"
                />
              ) : (
                <div className="flex h-48 w-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                  표지 없음
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                {completion.bookTitle}
              </h2>
              {completion.bookAuthor && (
                <p className="text-sm text-muted-foreground">
                  {completion.bookAuthor}
                </p>
              )}
              {completion.ownerName && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {completion.ownerName}
                  </span>
                  님의 독서 기록
                </p>
              )}

              <dl className="grid grid-cols-2 gap-3 pt-2 text-sm sm:max-w-md">
                {completedDateText && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      완독일
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {completedDateText}
                    </dd>
                  </div>
                )}
                {readingDaysText && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      독서 기간
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {readingDaysText}
                    </dd>
                  </div>
                )}
                {startedDateText && !readingDaysText && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      시작일
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">
                      {startedDateText}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-amber-500 p-6 text-white shadow-md sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">나도 독서 기록을 시작해보세요</h2>
          <p className="mt-2 text-sm text-emerald-50 sm:text-base">
            ReadTree는 책 한 권 한 권의 완독까지 함께하는 독서 기록 공간이에요. 지금 가입하면
            웰컴 포인트 200P를 드려요.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="lg">
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
      </div>
    </div>
  );
}
