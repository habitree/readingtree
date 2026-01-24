import { notFound } from "next/navigation";
import { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { PenTool, LogIn } from "lucide-react";
import type { ReadingStatus } from "@/types/book";
import { NotesList } from "@/components/notes/notes-list";
import { SampleNotesList } from "@/components/notes/sample-notes-list";
import { isValidUUID } from "@/lib/utils/validation";
import { sanitizeErrorForLogging } from "@/lib/utils/validation";
import { BookScrollHandler } from "@/components/books/book-scroll-handler";
import { BookTitle } from "@/components/books/book-title";

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

  return (
    <div className="space-y-6">
      <BookScrollHandler />

      {/* 게스트 사용자 안내 */}
      {isGuest && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">샘플 데이터</Badge>
                <p className="text-sm text-muted-foreground">
                  현재 샘플 책 정보를 보고 계십니다. 로그인하여 나만의 서재를 만들어보세요!
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div id="book-info" className="flex flex-col sm:flex-row gap-6 scroll-mt-4">
        {/* 책 표지 */}
        <div className="relative w-48 h-64 shrink-0 overflow-hidden rounded-lg bg-muted mx-auto sm:mx-0">
          <Image
            src={getImageUrl(book.cover_image_url)}
            alt={book.title}
            fill
            className="object-cover"
            sizes="192px"
            loading="eager"
            priority={true}
          />
        </div>

        {/* 책 정보 */}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <BookTitle
                title={book.title}
                mainTitleClassName="text-2xl sm:text-3xl"
                subtitleClassName="text-lg sm:text-xl text-muted-foreground mt-1"
              />
            </h1>
            {book.author && (
              <p className="text-lg text-muted-foreground mt-2">
                {book.author}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-2">
            <BookStatusBadge status={userBook.status as ReadingStatus} />
          </div>

          {/* 읽기 진행률 - 로그인 사용자만 표시 */}
          {!isGuest && (
            <div className="p-4 rounded-lg bg-muted/30 border">
              <ReadingProgress
                userBookId={userBook.id}
                currentPage={(userBook as any).current_page || 0}
                totalPages={book.total_pages}
                status={userBook.status as string}
              />
            </div>
          )}

          {/* 읽는 이유 */}
          <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-medium text-muted-foreground">읽는 이유</p>
              {/* 로그인 사용자만 편집 가능 */}
              {!isGuest && (
                <BookInfoEditor
                  userBookId={userBook.id}
                  currentReadingReason={userBook.reading_reason}
                  currentStartedAt={userBook.started_at}
                  currentCompletedDates={
                    (userBook as any).completed_dates && Array.isArray((userBook as any).completed_dates)
                      ? (userBook as any).completed_dates
                      : (userBook as any).completed_dates && typeof (userBook as any).completed_dates === 'string'
                        ? JSON.parse((userBook as any).completed_dates)
                        : userBook.completed_at
                          ? [userBook.completed_at]
                          : null
                  }
                  currentBookshelfId={(userBook as any).bookshelf_id || null}
                />
              )}
            </div>
            {userBook.reading_reason ? (
              <p className="text-sm italic">"{userBook.reading_reason}"</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {isGuest ? "읽는 이유가 등록되지 않았습니다." : "읽는 이유를 등록해보세요."}
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {book.publisher && (
              <div>
                <span className="font-medium">출판사:</span> {book.publisher}
              </div>
            )}
            {book.isbn && (
              <div>
                <span className="font-medium">ISBN:</span> {book.isbn}
              </div>
            )}
            {/* 시작일과 완독일을 함께 표시 */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="font-medium">시작일:</span>
                {userBook.started_at ? (
                  <span>{formatDate(userBook.started_at)}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {isGuest ? "미등록" : "시작일을 등록해보세요."}
                  </span>
                )}
              </div>
              {(() => {
                let dates: string[] = [];
                if ((userBook as any).completed_dates) {
                  if (Array.isArray((userBook as any).completed_dates)) {
                    dates = (userBook as any).completed_dates;
                  } else if (typeof (userBook as any).completed_dates === 'string') {
                    try {
                      dates = JSON.parse((userBook as any).completed_dates);
                    } catch {
                      dates = [];
                    }
                  }
                } else if (userBook.completed_at) {
                  dates = [userBook.completed_at];
                }
                return (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">완독일:</span>
                    {dates.length > 0 ? (
                      <span>
                        {dates.map((date: string, index: number) => (
                          <span key={index}>
                            {formatDate(date)}
                            {index < dates.length - 1 && ", "}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {isGuest ? "미등록" : "완독일을 등록해보세요."}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 로그인 사용자만 상태 변경 및 삭제 가능 */}
          {!isGuest && (
            <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
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

      {/* 기록 목록 영역 */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">기록</h2>
          {isGuest ? (
            <Button asChild variant="outline">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                로그인하고 기록 작성
              </Link>
            </Button>
          ) : (
            <Button asChild>
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
          <NotesList bookId={userBook.id} />
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

