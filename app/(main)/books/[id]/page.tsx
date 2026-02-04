import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { getBookDetail, updateBookStatus } from "@/app/actions/books";
import { getSampleBookDetail } from "@/app/actions/sample";
import { getCurrentUser } from "@/app/actions/auth";
import { getImageUrl } from "@/lib/utils/image";
import { formatDate } from "@/lib/utils/date";
import { BookStatusSelector } from "@/components/books/book-status-selector";
import { BookDeleteButton } from "@/components/books/book-delete-button";
import { BookInfoEditor } from "@/components/books/book-info-editor";
import { ReadingProgress } from "@/components/books/reading-progress";
import { PenTool, LogIn, BookOpen, Quote, Sparkles, Trophy, Link2 } from "lucide-react";
import { BookMetaInfo } from "@/components/books/book-meta-info";
import type { ReadingStatus } from "@/types/book";
import { SampleNotesList } from "@/components/notes/sample-notes-list";
import { BookNotesTabs } from "@/components/books/book-notes-tabs";
import { getNotes } from "@/app/actions/notes";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { BookScrollHandler } from "@/components/books/book-scroll-handler";
import { BookTitle } from "@/components/books/book-title";
import { RelatedBooksList } from "@/components/books/related-books-list";
import { RelatedBooksEditor } from "@/components/books/related-books-editor";

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

  // 현재 사용자 확인
  const user = await getCurrentUser();
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
      // 로그인 사용자: 본인 데이터 조회
      bookDetail = await getBookDetail(bookId);
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

  // 로그인 사용자의 경우 기록 목록 조회
  const notes = !isGuest ? await getNotes(userBook.id) : [];

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

      {/* 게스트 사용자 안내 - 더 눈에 띄는 디자인 */}
      {isGuest && (
        <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <CardContent className="py-4 sm:py-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
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
          </CardContent>
        </Card>
      )}

      {/* Hero Section - 책 표지 + 기본 정보 */}
      <div id="book-info" className={`relative rounded-xl sm:rounded-2xl overflow-hidden scroll-mt-4 bg-gradient-to-br ${theme.bg}`}>
        {/* 장식 요소 */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-bl from-white/40 dark:from-white/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-4 sm:p-6 lg:p-8">
          {/* 모바일: 세로 레이아웃 / PC: 가로 레이아웃 */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            {/* 책 표지 - 모바일에서 중앙, PC에서 왼쪽 */}
            <div className="flex flex-col items-center lg:items-start shrink-0">
              <div className="relative w-36 h-48 sm:w-44 sm:h-60 lg:w-48 lg:h-64 overflow-hidden rounded-lg sm:rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-[1.02]">
                <Image
                  src={getImageUrl(book.cover_image_url)}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 192px"
                  loading="eager"
                  priority={true}
                />
                {/* 완독 배지 오버레이 */}
                {userBook.status === "completed" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-transparent flex items-end justify-center pb-3">
                    <Badge className="bg-emerald-600 text-white shadow-lg">
                      <Trophy className="w-3 h-3 mr-1" />
                      완독
                    </Badge>
                  </div>
                )}
              </div>

              {/* 상태 배지 - 모바일에서 표지 아래 */}
              <div className="mt-3 flex lg:hidden">
                <BookStatusBadge status={userBook.status as ReadingStatus} />
              </div>
            </div>

            {/* 책 정보 */}
            <div className="flex-1 flex flex-col text-center lg:text-left min-w-0">
              {/* 상태 배지 - PC에서만 */}
              <div className="hidden lg:flex mb-3">
                <BookStatusBadge status={userBook.status as ReadingStatus} />
              </div>

              {/* 제목 & 저자 */}
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight leading-tight">
                  <BookTitle
                    title={book.title}
                    mainTitleClassName="text-xl sm:text-2xl lg:text-3xl"
                    subtitleClassName="text-base sm:text-lg lg:text-xl text-muted-foreground mt-1 font-normal"
                  />
                </h1>
                {book.author && (
                  <p className="text-base sm:text-lg text-muted-foreground mt-2 flex items-center justify-center lg:justify-start gap-1.5">
                    <span>{book.author}</span>
                  </p>
                )}
              </div>

              {/* 메타 정보 그리드 - PC에서만 표시 */}
              <BookMetaInfo
                publisher={book.publisher}
                isbn={book.isbn}
                startedAt={userBook.started_at}
                completedDates={completedDates}
                className="hidden lg:grid mb-4"
              />

              {/* 읽기 진행률 - 로그인 사용자만 */}
              {!isGuest && (
                <div className="mb-4">
                  <Card className={`border ${theme.border} bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm shadow-sm`}>
                    <CardContent className="p-3 sm:p-4">
                      <ReadingProgress
                        userBookId={userBook.id}
                        bookId={book.id}
                        isbn={book.isbn}
                        bookTitle={book.title}
                        bookAuthor={book.author}
                        currentPage={(userBook as any).current_page || 0}
                        totalPages={book.total_pages}
                        status={userBook.status as string}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 액션 버튼 - 로그인 사용자만 */}
              {!isGuest && (
                <div className="flex gap-2 flex-wrap justify-center lg:justify-start mt-auto">
                  <BookStatusSelector
                    currentStatus={userBook.status as ReadingStatus}
                    userBookId={userBook.id}
                    currentBookshelfId={(userBook as any).bookshelf_id || null}
                  />
                  <BookDeleteButton
                    userBookId={userBook.id}
                    bookTitle={book.title}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 전용 메타 정보 */}
      <div className="lg:hidden">
        <Card className="border-muted/50">
          <CardContent className="p-4">
            <BookMetaInfo
              publisher={book.publisher}
              isbn={book.isbn}
              startedAt={userBook.started_at}
              completedDates={completedDates}
            />
          </CardContent>
        </Card>
      </div>

      {/* 읽는 이유 카드 - 감성적 디자인 */}
      <Card className="border-none bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50 overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-primary/60 to-primary/20" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

        <CardContent className="p-4 sm:p-5 pl-5 sm:pl-6">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-primary/60" />
              <p className="text-sm font-medium text-muted-foreground">읽는 이유</p>
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
          {userBook.reading_reason ? (
            <blockquote className="text-sm sm:text-base leading-relaxed italic text-foreground/90 pl-2 border-l-2 border-primary/20">
              "{userBook.reading_reason}"
            </blockquote>
          ) : (
            <p className="text-sm text-muted-foreground italic pl-2">
              {isGuest ? "읽는 이유가 등록되지 않았습니다." : "이 책을 읽기로 한 이유를 기록해보세요."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 연결된 책 섹션 - 로그인 사용자만 */}
      {!isGuest && (
        <Card className="border-muted/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Link2 className="w-4 h-4 text-primary/70" />
                연결된 책
              </CardTitle>
              <RelatedBooksEditor userBookId={userBook.id} />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <RelatedBooksList userBookId={userBook.id} />
          </CardContent>
        </Card>
      )}

      {/* 기록 목록 영역 - 개선된 헤더 */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary/70" />
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">기록</h2>
          </div>
          {isGuest ? (
            <Button asChild variant="outline" size="sm" className="shadow-sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">로그인하고 </span>기록 작성
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" className="shadow-sm">
              <Link href={`/notes/new?bookId=${userBook.id}`}>
                <PenTool className="mr-2 h-4 w-4" />
                기록 작성
              </Link>
            </Button>
          )}
        </div>
        {isGuest ? (
          <SampleNotesList bookId={userBook.id} />
        ) : (
          <BookNotesTabs userBookId={userBook.id} notes={notes} />
        )}
      </div>
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
    const bookDetail = await getBookDetail(bookId);
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

