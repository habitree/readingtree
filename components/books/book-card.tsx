"use client";

import { useState, useCallback, useTransition, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookStatusBadge } from "./book-status-badge";
import { BookTitle } from "./book-title";
import { formatAuthor } from "@/lib/utils/book";
import { BookDeleteButton } from "./book-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Link2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { BookWithUserBook, ReadingStatus } from "@/types/book";
import type { BookWithNotes } from "@/app/actions/books";
import { toggleUserBookPin } from "@/app/actions/books";

interface RelatedBookPreview {
  userBookId: string;
  coverImageUrl: string | null;
  title: string;
}

interface BookCardProps {
  book: BookWithUserBook;
  userBookId: string;
  status: ReadingStatus;
  groupBooks?: BookWithNotes["groupBooks"];
  relatedBooks?: RelatedBookPreview[];
  isSample?: boolean;
  /** 즐겨찾기(핀) 여부 — 별 아이콘 채움/비어있음 표시 */
  isPinned?: boolean;
}

/**
 * 책 카드 컴포넌트
 * 책 목록에서 사용되는 카드 형태의 책 정보 표시
 * React.memo로 래핑하여 불필요한 리렌더링 방지
 */
function BookCardComponent({ book, userBookId, status, groupBooks, relatedBooks, isSample: isSampleProp = false, isPinned: isPinnedProp = false }: BookCardProps) {
  const { t } = useTranslation();
  // 이미지 상태를 단일 객체로 통합 (리렌더링 최적화)
  const [imageState, setImageState] = useState({ error: false, retryCount: 0 });
  const MAX_RETRIES = 2; // 최대 2번 재시도
  const hasValidImage = isValidImageUrl(book.cover_image_url) && book.cover_image_url && !imageState.error;
  // isSample은 prop으로 전달되거나 userBookId가 sample-로 시작하는 경우
  const isSample = isSampleProp || userBookId?.startsWith("sample-") || false;

  // 핀 토글 (낙관적 업데이트)
  const [pinned, setPinned] = useState(isPinnedProp);
  const [isPinPending, startPinTransition] = useTransition();
  const handleTogglePin = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isSample || isPinPending) return;
      const previous = pinned;
      setPinned(!previous);
      startPinTransition(async () => {
        try {
          const result = await toggleUserBookPin(userBookId);
          setPinned(result.isPinned);
          toast.success(result.isPinned ? "즐겨찾기에 추가했어요." : "즐겨찾기에서 제거했어요.");
        } catch (err) {
          setPinned(previous);
          const msg = err instanceof Error ? err.message : "요청에 실패했어요.";
          toast.error(msg);
        }
      });
    },
    [pinned, isPinPending, isSample, userBookId],
  );

  const handleImageError = useCallback(() => {
    setImageState((prev) => {
      if (prev.retryCount < MAX_RETRIES) {
        // 재시도: 짧은 지연 후 이미지 다시 로드 시도
        setTimeout(() => {
          setImageState((p) => ({ error: false, retryCount: p.retryCount + 1 }));
        }, 500 * (prev.retryCount + 1)); // 지수 백오프: 500ms, 1000ms
        return prev; // 현재 상태 유지 (setTimeout에서 업데이트)
      } else {
        // 최대 재시도 횟수 초과 시 에러 상태로 설정
        return { ...prev, error: true };
      }
    });
  }, []);

  // userBookId 검증 (모든 hooks 이후)
  if (!userBookId || typeof userBookId !== 'string' || userBookId.trim() === '') {
    console.error('BookCard: userBookId가 유효하지 않습니다.', { userBookId, book });
    return null;
  }

  return (
    <div className="relative group">
      <Link
        href={`/books/${userBookId}`}
        aria-label={t("books.viewBookDetail", { title: book.title })}
      >
        <Card
          className="hover:shadow-lg transition-shadow h-full cursor-pointer"
        >
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted" role="img" aria-label={t("books.bookCover", { title: book.title })}>
              {hasValidImage ? (
                <Image
                  key={`${book.cover_image_url}-retry-${imageState.retryCount}`}
                  src={getImageUrl(book.cover_image_url)}
                  alt={t("books.bookCover", { title: book.title })}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50" aria-label={t("books.noImage")}>
                  <BookOpen className="w-5 h-5 sm:w-8 sm:h-8 text-muted-foreground mb-0.5 sm:mb-1" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">{t("books.noImage")}</span>
                </div>
              )}
              {/* 모바일: 연결된 책 미니 배지 (좌하단, 심플) */}
              {relatedBooks && relatedBooks.length > 0 && (
                <div
                  className="absolute bottom-2 left-2 lg:hidden"
                  title={t("books.relatedBooksCount", { count: relatedBooks.length })}
                >
                  <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[11px] font-medium">
                    <Link2 className="w-2.5 h-2.5" />
                    <span>{relatedBooks.length}</span>
                  </div>
                </div>
              )}

              {/* 핀(즐겨찾기) 상태 뱃지 — 좌상단, 핀된 책에만 */}
              {pinned && (
                <div className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400/95 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-sm backdrop-blur-sm pointer-events-none">
                  <Star className="h-2.5 w-2.5 fill-current" />
                </div>
              )}
            </div>
            <div className="p-2 sm:p-2.5 space-y-0.5 sm:space-y-1">
              <div className="flex items-start justify-between gap-0.5 sm:gap-1">
                <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1 leading-tight">
                  <BookTitle title={book.title} />
                </h3>
                <BookStatusBadge status={status} className="shrink-0 scale-75 sm:scale-[0.85]" />
              </div>
              {book.author && (
                <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">
                  {formatAuthor(book.author)}
                </p>
              )}
              {book.publisher && (
                <p className="hidden lg:block text-[9px] sm:text-[10px] text-muted-foreground line-clamp-1 opacity-75">
                  {book.publisher}
                </p>
              )}
              {groupBooks && groupBooks.length > 0 && (
                <div className="hidden lg:flex flex-wrap gap-1 mt-1">
                  {groupBooks.map((gb) => (
                    <Badge
                      key={gb.group_id}
                      variant="secondary"
                      className="text-[9px] sm:text-[10px] px-1 py-0"
                      title={t("books.groupDesignatedBook", { name: gb.group_name })}
                    >
                      <Users className="mr-0.5 h-2 w-2" />
                      <span className="line-clamp-1">{gb.group_name}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {/* 읽기 진행률 표시 (Goal Gradient Effect - 진행 시각화가 완료 가속) */}
              {book.total_pages && book.user_book?.current_page && status === "reading" && (
                <div className="hidden lg:block mt-1 space-y-0.5">
                  <Progress
                    value={(book.user_book.current_page / book.total_pages) * 100}
                    className="h-0.5 sm:h-1"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-muted-foreground">
                      {book.user_book.current_page}/{book.total_pages}p
                    </span>
                    <span className="text-[9px] font-medium text-primary">
                      {Math.round((book.user_book.current_page / book.total_pages) * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* PC: 연결된 책 심플 버튼 + 호버 미리보기 */}
              {relatedBooks && relatedBooks.length > 0 && (
                <div className="hidden lg:block mt-1 pt-1 border-t border-border/50">
                  <HoverCard openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors w-full"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Link2 className="w-2.5 h-2.5" />
                        <span>{t("books.linkedCount", { count: relatedBooks.length })}</span>
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="top"
                      align="start"
                      className="w-auto p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        {relatedBooks.slice(0, 3).map((related) => (
                          <Link
                            key={related.userBookId}
                            href={`/books/${related.userBookId}`}
                            className="group/related flex flex-col items-center gap-1 p-1 rounded hover:bg-muted/50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative w-10 h-14 rounded overflow-hidden bg-muted shadow-sm ring-1 ring-border/30 group-hover/related:ring-primary/50 transition-all">
                              {related.coverImageUrl ? (
                                <Image
                                  src={getImageUrl(related.coverImageUrl)}
                                  alt={related.title}
                                  fill
                                  className="object-cover"
                                  sizes="40px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground group-hover/related:text-foreground line-clamp-1 max-w-[60px] text-center transition-colors">
                              {related.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
      {/* 우상단 액션 버튼들: 핀 토글 + 삭제 (샘플 데이터 제외) */}
      {!isSample && (
        <div
          className={cn(
            "absolute top-0.5 right-0.5 sm:top-2 sm:right-2 z-10 flex items-center gap-1 transition-opacity origin-top-right",
            "scale-75 sm:scale-100",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 핀 토글 버튼 */}
          <button
            type="button"
            onClick={handleTogglePin}
            disabled={isPinPending}
            aria-label={pinned ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={pinned}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm border transition-all",
              pinned
                ? "bg-amber-400 text-amber-900 border-amber-300 hover:bg-amber-300 opacity-100"
                : cn(
                    "bg-white/90 dark:bg-slate-900/90 text-slate-500 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-900 border-white/60 dark:border-slate-700/60",
                    // 미핀 상태는 모바일 반투명 / PC 호버 강조
                    "opacity-50 active:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
                  ),
              isPinPending && "opacity-60 cursor-not-allowed",
            )}
          >
            {isPinPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Star className={cn("h-3.5 w-3.5", pinned && "fill-current")} />
            )}
          </button>

          {/* 삭제 버튼 */}
          <div
            className={cn(
              "transition-opacity",
              "opacity-50 active:opacity-100",
              "sm:opacity-0 sm:group-hover:opacity-100",
            )}
          >
            <BookDeleteButton
              userBookId={userBookId}
              bookTitle={book.title}
              variant="icon"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// React.memo로 래핑하여 props가 변경되지 않으면 리렌더링 방지
export const BookCard = memo(BookCardComponent);

