import { cache } from "react";
import { getCachedCurrentUser } from "@/lib/cached";
import { notFound, redirect } from "next/navigation";
import { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { getBookDetail } from "@/app/actions/books";
import { getSampleBookDetail, getSampleNotes } from "@/app/actions/sample";
import { getImageUrl } from "@/lib/utils/image";
import { BookStatusSelector } from "@/components/books/book-status-selector";
import { BookDeleteButton } from "@/components/books/book-delete-button";
import { BookInfoEditor } from "@/components/books/book-info-editor";
import { ReadingProgress } from "@/components/books/reading-progress";
import { PenTool, Quote, Trophy, Link2, ChevronDown, Info, Calendar } from "lucide-react";
import { BookMetaInfo } from "@/components/books/book-meta-info";
import type { ReadingStatus } from "@/types/book";
import { BookNotesTabs } from "@/components/books/book-notes-tabs";
import { getNotes, getFreeNotesForBook } from "@/app/actions/notes";
import { getUnifiedRecords } from "@/app/actions/records";
import { getProgressLogsAsNotes } from "@/app/actions/progress";
import { isUnifiedFeedEnabled, isProgressInLogsEnabled } from "@/lib/feature-flags";
import type { UnifiedRecord } from "@/types/unified-record";
import { getRelatedBooks } from "@/app/actions/book-relations";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";
import { BookScrollHandler } from "@/components/books/book-scroll-handler";
import { BookTitle } from "@/components/books/book-title";
import { formatAuthor } from "@/lib/utils/book";
import { RelatedBooksList } from "@/components/books/related-books-list";
import { BookLinkedFreeNotes } from "@/components/books/book-linked-free-notes";
import { RelatedBooksEditor } from "@/components/books/related-books-editor";
import { ReadingReportButton } from "@/components/books/reading-report-button";
import { BookTimerButton } from "@/components/books/book-timer-button";
import { getSavedReport } from "@/app/actions/ai/report";
import {
  GuestCtaText,
  GuestCtaButtonLabel,
  CompletedBadgeLabel,
  StartedDateSuffix,
  CompletedDateSuffix,
  ReadingReasonPrompt,
  WriteNoteLabel,
  ReadingRecordsHeading,
  BookInfoSectionLabel,
  RelatedBooksLabel,
} from "@/components/books/book-detail-strings";

// React cache()로 동일 요청 내 중복 호출 방지 (책 상세 전용)
const getCachedBookDetail = cache(
  (bookId: string, userId: string) => getBookDetail(bookId)
);

interface BookDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 책 상세 페이지
 * US-008: 책 정보 조회
 * US-009: 독서 상태 관리
 */
export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  if (!bookId || typeof bookId !== 'string') {
    console.error("BookDetailPage: bookId가 유효하지 않습니다.", { bookId, params: resolvedParams });
    notFound();
  }

  if (!bookId.startsWith("sample-") && !isValidUUID(bookId)) {
    console.error("BookDetailPage: bookId가 유효한 UUID가 아닙니다.", { bookId });
    notFound();
  }

  const user = await getCachedCurrentUser();
  const isGuest = !user;

  let bookDetail;
  let isSample = false;

  try {
    console.log("BookDetailPage: 책 상세 조회 시도", { bookId, isGuest });

    if (isGuest) {
      try {
        bookDetail = await getSampleBookDetail(bookId);
        isSample = true;
      } catch {
        notFound();
      }
    } else {
      bookDetail = await getCachedBookDetail(bookId, user.id);
    }

    console.log("BookDetailPage: 책 상세 조회 성공", { bookId, hasBook: !!bookDetail, isSample });
  } catch (error) {
    const safeError = sanitizeErrorForLogging(error);
    console.error("책 상세 조회 오류:", {
      bookId,
      error: safeError,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    notFound();
  }

  const book = bookDetail.books as any;

  // books.id로 fallback 조회된 경우, 올바른 user_books.id URL로 리다이렉트
  if ((bookDetail as any)._resolvedFromBookId) {
    redirect(`/books/${bookDetail.id}`);
  }

  // 자유 기록(READTREE_BOOK_ID) 접근 시 전용 페이지로 리다이렉트
  if (book?.id === READTREE_BOOK_ID) {
    redirect("/notes/free");
  }

  const userBook = bookDetail;

  let notes: Awaited<ReturnType<typeof getNotes>> = [];
  let relatedBooks: Awaited<ReturnType<typeof getRelatedBooks>> = [];
  let savedReport: Awaited<ReturnType<typeof getSavedReport>> = null;
  let linkedFreeNotes: Awaited<ReturnType<typeof getFreeNotesForBook>> = [];
  let unifiedRecords: UnifiedRecord[] | null = null;
  let unifiedNextCursor: string | null = null;

  if (isGuest) {
    // 게스트: 샘플 사용자의 노트 데이터를 그대로 표시
    try {
      notes = await getSampleNotes(userBook.id);
    } catch (e) {
      console.error("게스트 노트 조회 실패:", e);
      notes = [];
    }
  } else {
    const [notesResult, relatedBooksResult, savedReportResult, linkedFreeNotesResult, unifiedResult] =
      await Promise.all([
        getNotes(userBook.id, undefined, user),
        getRelatedBooks(userBook.id, user).catch(() => []),
        getSavedReport(userBook.id).catch(() => null),
        getFreeNotesForBook(userBook.id, user).catch(() => []),
        isUnifiedFeedEnabled()
          ? getUnifiedRecords({ bookId: userBook.id, limit: 30 }, user).catch(() => null)
          : Promise.resolve(null),
      ]);
    notes = notesResult;
    relatedBooks = relatedBooksResult;
    savedReport = savedReportResult;
    linkedFreeNotes = linkedFreeNotesResult;
    unifiedRecords = unifiedResult?.records ?? null;
    unifiedNextCursor = unifiedResult?.nextCursor ?? null;

    // 데이터 단일화(§11 ③): 진행 기록을 reading_logs에서도 읽어 여정/탭에 합류(dual-source).
    // 레거시 notes(progress)와 분리(disjoint) — 새 진행은 logs, 기존은 notes.
    if (isProgressInLogsEnabled()) {
      const progressLogNotes = await getProgressLogsAsNotes(userBook.id, user).catch(() => []);
      if (progressLogNotes.length > 0) notes = [...notes, ...progressLogNotes];
    }
  }

  // 완독 날짜 배열 계산
  let completedDates: string[] = [];
  if ((userBook as any).completed_dates) {
    if (Array.isArray((userBook as any).completed_dates)) {
      completedDates = (userBook as any).completed_dates;
    } else if (typeof (userBook as any).completed_dates === 'string') {
      try {
        completedDates = JSON.parse((userBook as any).completed_dates);
      } catch {
        completedDates = [];
      }
    }
  } else if (userBook.completed_at) {
    completedDates = [userBook.completed_at];
  }
  // 과거 → 최근 순 정렬 (마지막 요소가 가장 최근 완독일)
  completedDates = [...completedDates].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // 상태에 따른 테마 색상
  const statusTheme = {
    reading: { bg: "from-blue-500/10 via-blue-400/5 to-transparent", accent: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
    completed: { bg: "from-emerald-500/10 via-emerald-400/5 to-transparent", accent: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
    paused: { bg: "from-amber-500/10 via-amber-400/5 to-transparent", accent: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    not_started: { bg: "from-slate-500/10 via-slate-400/5 to-transparent", accent: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800" },
    rereading: { bg: "from-purple-500/10 via-purple-400/5 to-transparent", accent: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  };
  const theme = statusTheme[userBook.status as keyof typeof statusTheme] || statusTheme.reading;

  // 날짜 포맷팅 헬퍼
  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 pb-[calc(var(--mobile-bottom-offset)_+_2rem)] lg:pb-8">
      <BookScrollHandler />

      {/* 게스트: 하단 고정 가입 유도 CTA */}
      {isGuest && (
        <div className="fixed bottom-[calc(var(--mobile-bottom-offset))] lg:bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur-sm p-3 sm:p-4 lg:ml-64">
          <div className="container max-w-7xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <GuestCtaText />
            </p>
            <Button asChild size="sm" className="shrink-0">
              <Link href="/login"><GuestCtaButtonLabel /></Link>
            </Button>
          </div>
        </div>
      )}

      {/* ===== 1. 히어로 섹션 ===== */}
      <div id="book-info" className={`relative rounded-xl sm:rounded-2xl overflow-hidden scroll-mt-4 bg-gradient-to-br ${theme.bg}`}>
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-white/40 dark:from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex flex-row gap-3 sm:gap-5 lg:gap-8">
            {/* 책 표지 */}
            <div className="shrink-0">
              <div className="relative w-20 h-28 sm:w-28 sm:h-40 md:w-36 md:h-48 lg:w-48 lg:h-64 overflow-hidden rounded-lg sm:rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-[1.02]">
                <Image
                  src={getImageUrl(book.cover_image_url)}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 80px, (max-width: 768px) 112px, (max-width: 1024px) 144px, 192px"
                  loading="eager"
                  priority={true}
                />
                {userBook.status === "completed" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent flex items-end justify-center pb-2 sm:pb-3">
                    <Badge className="bg-emerald-600 text-white shadow-lg text-[10px] sm:text-xs">
                      <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      <CompletedBadgeLabel />
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* 책 정보 */}
            <div className="flex-1 flex flex-col text-left min-w-0">
              {/* 상태 배지/선택 + 정보수정 */}
              <div className="mb-1 sm:mb-2 flex items-center justify-between">
                {isGuest ? (
                  <BookStatusBadge status={userBook.status as ReadingStatus} />
                ) : (
                  <BookStatusSelector
                    currentStatus={userBook.status as ReadingStatus}
                    userBookId={userBook.id}
                    currentBookshelfId={(userBook as any).bookshelf_id || null}
                    compact
                  />
                )}
                {!isGuest && (
                  <BookInfoEditor
                    userBookId={userBook.id}
                    currentReadingReason={userBook.reading_reason}
                    currentStartedAt={userBook.started_at}
                    currentCompletedDates={completedDates.length > 0 ? completedDates : null}
                    currentBookshelfId={(userBook as any).bookshelf_id || null}
                    iconOnly
                  />
                )}
              </div>

              {/* 제목 */}
              <h1 className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold tracking-tight leading-tight">
                <BookTitle
                  title={book.title}
                  mainTitleClassName="text-base sm:text-lg md:text-xl lg:text-3xl line-clamp-2"
                  subtitleClassName="text-sm sm:text-base lg:text-xl text-muted-foreground mt-0.5 sm:mt-1 font-normal line-clamp-1"
                />
              </h1>

              {/* 저자 */}
              {book.author && (
                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-1.5 line-clamp-1">
                  {formatAuthor(book.author)}
                </p>
              )}

              {/* 날짜 정보 - 시작일/완독일 인라인 */}
              {(userBook.started_at || completedDates.length > 0) && (
                <div className="flex items-center gap-1.5 mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 opacity-60" />
                  {userBook.started_at && (
                    <span>{formatShortDate(userBook.started_at)}<StartedDateSuffix /></span>
                  )}
                  {userBook.started_at && completedDates.length > 0 && (
                    <span className="opacity-40">·</span>
                  )}
                  {completedDates.length > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {formatShortDate(completedDates[completedDates.length - 1])}
                      <CompletedDateSuffix count={completedDates.length} />
                    </span>
                  )}
                </div>
              )}

              {/* AI 리포트 버튼 */}
              <div className="mt-2 sm:mt-3">
                <ReadingReportButton
                  userBookId={userBook.id}
                  noteCount={notes.length}
                  isGuest={isGuest}
                  savedReport={savedReport}
                />
              </div>

              {/* 읽는 이유 - PC에서만 히어로 안에 표시 */}
              {userBook.reading_reason && (
                <div className="hidden lg:flex items-start gap-2 mt-3 pt-3 border-t border-foreground/5">
                  <Quote className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed text-foreground/70 line-clamp-2 italic">
                    &ldquo;{userBook.reading_reason}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 모바일: 읽는 이유 (히어로 바로 아래) ===== */}
      <div className="lg:hidden">
        <div className="rounded-lg bg-muted/20 p-3">
          <div className="flex items-start gap-2">
            <Quote className="w-3.5 h-3.5 text-primary/50 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {userBook.reading_reason ? (
                <p className="text-sm leading-relaxed text-foreground/80 italic">
                  &ldquo;{userBook.reading_reason}&rdquo;
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <ReadingReasonPrompt bookTitle={book.title} />
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== 2. 액션바 ===== */}
      {!isGuest && (
        <>
          {/* --- 모바일 액션바 (sticky) --- */}
          <div className="lg:hidden sticky top-12 sm:top-14 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2.5 bg-background/95 backdrop-blur-sm border-b border-border/40">
            <div className="space-y-2.5">
              {/* 진행률 */}
              <ReadingProgress
                userBookId={userBook.id}
                bookId={book.id}
                isbn={book.isbn}
                bookTitle={book.title}
                bookAuthor={book.author}
                currentPage={(userBook as any).current_page || 0}
                totalPages={book.total_pages}
                status={userBook.status as string}
                startedAt={userBook.started_at}
                completedDates={completedDates}
              />
              {/* 기록 작성 + 타이머 버튼 */}
              <div className="flex gap-2">
                <Button asChild size="sm" className="flex-1 shadow-sm bg-primary hover:bg-primary/90 h-9">
                  <Link href={`/notes/new?bookId=${userBook.id}`}>
                    <PenTool className="mr-2 h-4 w-4" />
                    <WriteNoteLabel />
                  </Link>
                </Button>
                <BookTimerButton
                  userBookId={userBook.id}
                  bookId={book.id}
                  title={book.title}
                  coverUrl={book.cover_image_url}
                  size="sm"
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {/* --- PC 액션바 (카드형, 단일 컬럼) --- */}
          <div className="hidden lg:block">
            <div className="rounded-xl border border-border/50 bg-card/80 shadow-sm p-5 space-y-4">
              {/* 진행률 + 모멘텀 */}
              <ReadingProgress
                userBookId={userBook.id}
                bookId={book.id}
                isbn={book.isbn}
                bookTitle={book.title}
                bookAuthor={book.author}
                currentPage={(userBook as any).current_page || 0}
                totalPages={book.total_pages}
                status={userBook.status as string}
                startedAt={userBook.started_at}
                completedDates={completedDates}
              />
              {/* 기록 작성 + 타이머 버튼 */}
              <div className="pt-1 border-t border-border/30 space-y-2">
                <Button asChild size="default" className="w-full shadow-sm bg-primary hover:bg-primary/90 h-10">
                  <Link href={`/notes/new?bookId=${userBook.id}`}>
                    <PenTool className="mr-2 h-4 w-4" />
                    <WriteNoteLabel />
                  </Link>
                </Button>
                <BookTimerButton
                  userBookId={userBook.id}
                  bookId={book.id}
                  title={book.title}
                  coverUrl={book.cover_image_url}
                  size="default"
                  className="w-full h-10"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== 3. 독서 기록 영역 ===== */}
      <div id="reading-records" className="scroll-mt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight"><ReadingRecordsHeading /></h2>
            {notes.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                {notes.length}
              </span>
            )}
          </div>
        </div>

        <BookNotesTabs
          userBookId={userBook.id}
          notes={notes}
          startedAt={userBook.started_at}
          completedDates={completedDates}
          status={userBook.status}
          currentPage={(userBook as any).current_page || 0}
          totalPages={book.total_pages ?? null}
          bookInfo={{
            bookId: book.id,
            title: book.title,
            author: book.author,
            coverImageUrl: book.cover_image_url,
            totalPages: book.total_pages ?? null,
          }}
          unifiedRecords={unifiedRecords}
          unifiedNextCursor={unifiedNextCursor}
        />
      </div>

      {/* ===== 3-1. 연결된 자유기록 ===== */}
      {!isGuest && linkedFreeNotes.length > 0 && (
        <BookLinkedFreeNotes linkedNotes={linkedFreeNotes} />
      )}

      {/* ===== 4. 도서 정보 접이식 섹션 ===== */}
      <details className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <summary className="flex items-center justify-between cursor-pointer p-3 sm:p-4 hover:bg-muted/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="w-4 h-4" />
            <BookInfoSectionLabel />
            {book.publisher && (
              <span className="text-xs opacity-60">· {book.publisher}</span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="border-t border-border/50 p-3 sm:p-4 space-y-4">
          <BookMetaInfo
            publisher={book.publisher}
            isbn={book.isbn}
            startedAt={userBook.started_at}
            completedDates={completedDates}
          />

          {!isGuest && (
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Link2 className="w-3.5 h-3.5" />
                  <RelatedBooksLabel />
                  {relatedBooks.length > 0 && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                      {relatedBooks.length}
                    </span>
                  )}
                </div>
                <RelatedBooksEditor userBookId={userBook.id} />
              </div>
              <RelatedBooksList userBookId={userBook.id} initialBooks={relatedBooks} />
            </div>
          )}

          {!isGuest && (
            <div className="pt-3 border-t border-border/30">
              <BookDeleteButton
                userBookId={userBook.id}
                bookTitle={book.title}
              />
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  if (!bookId || typeof bookId !== 'string') {
    return { title: "책 상세 | ReadTree" };
  }

  if (!bookId.startsWith("sample-") && !isValidUUID(bookId)) {
    return { title: "책 상세 | ReadTree" };
  }

  try {
    const user = await getCachedCurrentUser();
    if (!user) {
      return { title: "책 상세 | ReadTree" };
    }
    const bookDetail = await getCachedBookDetail(bookId, user.id);
    const book = bookDetail.books as any;

    return {
      title: `${book.title} | ReadTree`,
      description: `${book.author ? `${formatAuthor(book.author)} 저` : ""} ${book.title}`,
    };
  } catch {
    return { title: "책 상세 | ReadTree" };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}
