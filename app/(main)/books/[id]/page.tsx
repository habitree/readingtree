import { cache } from "react";
import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { getBookDetail } from "@/app/actions/books";
import { getSampleBookDetail } from "@/app/actions/sample";
import { getCurrentUser } from "@/app/actions/auth";
import { getImageUrl } from "@/lib/utils/image";
import { BookStatusSelector } from "@/components/books/book-status-selector";
import { BookDeleteButton } from "@/components/books/book-delete-button";
import { BookInfoEditor } from "@/components/books/book-info-editor";
import { ReadingProgress } from "@/components/books/reading-progress";
import { PenTool, LogIn, Quote, Sparkles, Trophy, Link2, ChevronDown, Info } from "lucide-react";
import { BookMetaInfo } from "@/components/books/book-meta-info";
import type { ReadingStatus } from "@/types/book";
import { SampleNotesList } from "@/components/notes/sample-notes-list";
import { BookNotesTabs } from "@/components/books/book-notes-tabs";
import { getNotes } from "@/app/actions/notes";
import { getRelatedBooks } from "@/app/actions/book-relations";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { BookScrollHandler } from "@/components/books/book-scroll-handler";
import { BookTitle } from "@/components/books/book-title";
import { RelatedBooksList } from "@/components/books/related-books-list";
import { RelatedBooksEditor } from "@/components/books/related-books-editor";

// React cache()로 동일 요청 내 중복 호출 방지
// generateMetadata + BookDetailPage에서 호출해도 1번만 실행
const getCachedCurrentUser = cache(() => getCurrentUser());
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
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  // params.id 검증
  if (!bookId || typeof bookId !== 'string') {
    console.error("BookDetailPage: bookId가 유효하지 않습니다.", { bookId, params: resolvedParams });
    notFound();
  }

  // 샘플 데이터 ID는 UUID가 아니므로 별도 처리
  // UUID 검증 (샘플 데이터 제외)
  if (!bookId.startsWith("sample-") && !isValidUUID(bookId)) {
    console.error("BookDetailPage: bookId가 유효한 UUID가 아닙니다.", { bookId });
    notFound();
  }

  // 현재 사용자 확인 (cache()로 generateMetadata와 중복 호출 방지)
  const user = await getCachedCurrentUser();
  const isGuest = !user;

  let bookDetail;
  let isSample = false;

  try {
    console.log("BookDetailPage: 책 상세 조회 시도", { bookId, isGuest });

    if (isGuest) {
      // 비로그인 사용자: 샘플(관리자) 데이터 조회
      try {
        bookDetail = await getSampleBookDetail(bookId);
        isSample = true;
      } catch {
        // 샘플 데이터에서 찾지 못하면 404
        notFound();
      }
    } else {
      // 로그인 사용자: 본인 데이터 조회 (cache 적용)
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
  const userBook = bookDetail;

  // 로그인 사용자: getNotes + getRelatedBooks를 병렬 호출 (user 전달로 내부 auth 중복 제거)
  let notes: Awaited<ReturnType<typeof getNotes>> = [];
  let relatedBooks: Awaited<ReturnType<typeof getRelatedBooks>> = [];

  if (!isGuest) {
    const [notesResult, relatedBooksResult] = await Promise.all([
      getNotes(userBook.id, undefined, user),
      getRelatedBooks(userBook.id, user).catch(() => []),
    ]);
    notes = notesResult;
    relatedBooks = relatedBooksResult;
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

  // 상태에 따른 테마 색상
  const statusTheme = {
    reading: { bg: "from-blue-500/10 via-blue-400/5 to-transparent", accent: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
    completed: { bg: "from-emerald-500/10 via-emerald-400/5 to-transparent", accent: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
    paused: { bg: "from-amber-500/10 via-amber-400/5 to-transparent", accent: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
    not_started: { bg: "from-slate-500/10 via-slate-400/5 to-transparent", accent: "text-slate-600 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800" },
    rereading: { bg: "from-purple-500/10 via-purple-400/5 to-transparent", accent: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
  };
  const theme = statusTheme[userBook.status as keyof typeof statusTheme] || statusTheme.reading;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pb-8">
      <BookScrollHandler />

      {/* 게스트 사용자 안내 */}
      {isGuest && (
        <div className="flex items-center justify-between flex-wrap gap-3 px-3 py-3 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/80 dark:bg-slate-800/80 shadow-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              샘플
            </Badge>
            <p className="text-sm text-muted-foreground">
              로그인하여 나만의 서재를 만들어보세요!
            </p>
          </div>
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              시작하기
            </Link>
          </Button>
        </div>
      )}

      {/* 1. 컴팩트 히어로 섹션 - 항상 수평 레이아웃, 정체성만 표시 */}
      <div id="book-info" className={`relative rounded-xl sm:rounded-2xl overflow-hidden scroll-mt-4 bg-gradient-to-br ${theme.bg}`}>
        {/* 장식 요소 */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-white/40 dark:from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* 항상 수평 레이아웃 */}
          <div className="flex flex-row gap-3 sm:gap-5 lg:gap-8">
            {/* 책 표지 - 반응형 크기 */}
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
                {/* 완독 배지 오버레이 */}
                {userBook.status === "completed" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent flex items-end justify-center pb-2 sm:pb-3">
                    <Badge className="bg-emerald-600 text-white shadow-lg text-[10px] sm:text-xs">
                      <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                      완독
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* 책 정보 - 항상 좌측 정렬 */}
            <div className="flex-1 flex flex-col text-left min-w-0">
              {/* 상태 배지 - 제목 위 인라인 */}
              <div className="mb-1.5 sm:mb-2">
                <BookStatusBadge status={userBook.status as ReadingStatus} />
              </div>

              {/* 제목 & 저자 */}
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold tracking-tight leading-tight">
                  <BookTitle
                    title={book.title}
                    mainTitleClassName="text-base sm:text-lg md:text-xl lg:text-3xl line-clamp-2"
                    subtitleClassName="text-sm sm:text-base lg:text-xl text-muted-foreground mt-0.5 sm:mt-1 font-normal line-clamp-1"
                  />
                </h1>
                {book.author && (
                  <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 line-clamp-1">
                    {book.author}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 스티키 액션바 - 진행률 + 기록작성 CTA (로그인 사용자만) */}
      {!isGuest && (
        <div className="sticky top-12 sm:top-14 z-20 -mx-2 sm:-mx-4 px-2 sm:px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 lg:relative lg:top-0 lg:mx-0 lg:px-0 lg:py-0 lg:bg-transparent lg:backdrop-blur-none lg:border-b-0">
          <div className="lg:rounded-xl lg:border lg:border-border/50 lg:bg-card/80 lg:backdrop-blur-sm lg:p-4 lg:shadow-sm space-y-3">
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
            />

            {/* 액션 버튼 그룹 */}
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="flex-1 shadow-sm bg-primary hover:bg-primary/90 h-9 sm:h-10">
                <Link href={`/notes/new?bookId=${userBook.id}`}>
                  <PenTool className="mr-2 h-4 w-4" />
                  기록 작성
                </Link>
              </Button>
              <BookStatusSelector
                currentStatus={userBook.status as ReadingStatus}
                userBookId={userBook.id}
                currentBookshelfId={(userBook as any).bookshelf_id || null}
              />
              <BookInfoEditor
                userBookId={userBook.id}
                currentReadingReason={userBook.reading_reason}
                currentStartedAt={userBook.started_at}
                currentCompletedDates={completedDates.length > 0 ? completedDates : null}
                currentBookshelfId={(userBook as any).bookshelf_id || null}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. 독서 기록 영역 */}
      <div id="reading-records" className="scroll-mt-4">
        {/* 헤더: 제목 + 기록 개수 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PenTool className="w-4 h-4 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">독서 기록</h2>
            {!isGuest && notes.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                {notes.length}
              </span>
            )}
          </div>
          {isGuest && (
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">로그인하고 </span>기록 작성
              </Link>
            </Button>
          )}
        </div>

        {/* 기록 탭/목록 */}
        {isGuest ? (
          <SampleNotesList bookId={userBook.id} />
        ) : (
          <BookNotesTabs userBookId={userBook.id} notes={notes} />
        )}
      </div>

      {/* 4. 읽는 이유 - 컴팩트 인라인 */}
      <div className="rounded-lg bg-muted/20 p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Quote className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">읽는 이유</p>
            {userBook.reading_reason ? (
              <p className="text-sm sm:text-base leading-relaxed text-foreground/90">
                &ldquo;{userBook.reading_reason}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isGuest
                  ? "읽는 이유가 등록되지 않았습니다."
                  : `'${book.title}'을 읽기로 한 계기를 기록해보세요`}
              </p>
            )}
          </div>
          {!isGuest && (
            <BookInfoEditor
              userBookId={userBook.id}
              currentReadingReason={userBook.reading_reason}
              currentStartedAt={userBook.started_at}
              currentCompletedDates={completedDates.length > 0 ? completedDates : null}
              currentBookshelfId={(userBook as any).bookshelf_id || null}
            />
          )}
        </div>
      </div>

      {/* 5. 도서 정보 접이식 섹션 (메타 + 연결된 책 + 삭제) */}
      <details className="group rounded-lg border border-border/50 bg-card/50 overflow-hidden">
        <summary className="flex items-center justify-between cursor-pointer p-3 sm:p-4 hover:bg-muted/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="w-4 h-4" />
            도서 정보
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="border-t border-border/50 p-3 sm:p-4 space-y-4">
          {/* 메타 정보 */}
          <BookMetaInfo
            publisher={book.publisher}
            isbn={book.isbn}
            startedAt={userBook.started_at}
            completedDates={completedDates}
          />

          {/* 연결된 책 */}
          {!isGuest && (
            <div className="pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Link2 className="w-3.5 h-3.5" />
                  연결된 책
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

          {/* 책 삭제 - 최하단 */}
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
  // Next.js 15+ 에서 params는 Promise일 수 있음
  const resolvedParams = await params;
  const bookId = resolvedParams.id;

  // params.id 검증
  if (!bookId || typeof bookId !== 'string') {
    return {
      title: "책 상세 | ReadTree",
    };
  }

  // UUID 검증 (샘플 데이터는 메타데이터 생성하지 않음)
  if (!bookId.startsWith("sample-") && !isValidUUID(bookId)) {
    return {
      title: "책 상세 | ReadTree",
    };
  }

  try {
    // getCachedCurrentUser()로 BookDetailPage와 중복 호출 방지
    const user = await getCachedCurrentUser();
    if (!user) {
      return { title: "책 상세 | ReadTree" };
    }
    const bookDetail = await getCachedBookDetail(bookId, user.id);
    const book = bookDetail.books as any;

    return {
      title: `${book.title} | ReadTree`,
      description: `${book.author ? `${book.author} 저` : ""} ${book.title}`,
    };
  } catch {
    return {
      title: "책 상세 | ReadTree",
    };
  }
}

export async function generateViewport(): Promise<Viewport> {
  return {
    width: 'device-width',
    initialScale: 1,
  };
}
