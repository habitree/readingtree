"use client";

import { useState, useCallback, memo, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, Plus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { addBook, getBookCoverByIsbn } from "@/app/actions/books";
import { toast } from "sonner";
import type { PopularBook } from "@/lib/api/data4library-types";

interface PopularBookCardProps {
  book: PopularBook;
  /** 표시 모드: 'compact' (목록용), 'full' (상세) */
  variant?: "compact" | "full";
  /** 트렌딩(급상승) 표시 */
  showTrending?: boolean;
  /** 마니아 추천 표시 */
  showMania?: boolean;
  /** 내 서재에 추가 버튼 표시 (로그인 상태) */
  showAddButton?: boolean;
  /** 추가 후 콜백 */
  onAdd?: (isbn: string) => void;
}

/**
 * 인기 도서 카드 컴포넌트
 * 도서관 정보나루 API 기반 인기/급상승/추천 도서 표시
 */
function PopularBookCardComponent({
  book,
  variant = "compact",
  showTrending = false,
  showMania = false,
  showAddButton = false,
  onAdd,
}: PopularBookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [fallbackCoverUrl, setFallbackCoverUrl] = useState<string | null>(null);
  const [isFetchingCover, setIsFetchingCover] = useState(false);
  const [coverFetchAttempted, setCoverFetchAttempted] = useState(false);

  // 현재 사용할 이미지 URL 결정
  const currentCoverUrl = fallbackCoverUrl || book.coverImageUrl;
  const hasValidImage = isValidImageUrl(currentCoverUrl) && currentCoverUrl && !imageError;

  // 이미지가 없거나 로드 실패 시 fallback 이미지 조회
  useEffect(() => {
    // 이미 유효한 이미지가 있거나, 이미 시도했거나, 현재 조회 중이면 스킵
    if (hasValidImage || coverFetchAttempted || isFetchingCover) return;

    // 이미지 오류가 발생했거나 처음부터 이미지가 없는 경우
    if (imageError || !book.coverImageUrl || !isValidImageUrl(book.coverImageUrl)) {
      if (!book.isbn13) return;

      setIsFetchingCover(true);
      setCoverFetchAttempted(true);

      getBookCoverByIsbn(book.isbn13, book.title)
        .then(({ coverUrl }) => {
          if (coverUrl) {
            setFallbackCoverUrl(coverUrl);
            setImageError(false); // 새 URL로 리셋
          }
        })
        .catch((err) => {
          console.error("[PopularBookCard] 표지 조회 실패:", err);
        })
        .finally(() => {
          setIsFetchingCover(false);
        });
    }
  }, [book.isbn13, book.title, book.coverImageUrl, imageError, hasValidImage, coverFetchAttempted, isFetchingCover]);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleAddToLibrary = useCallback(async () => {
    if (!book.isbn13) {
      toast.error("ISBN 정보가 없어 추가할 수 없습니다.");
      return;
    }

    setIsAdding(true);
    try {
      // fallback 표지가 있으면 그것을 사용, 없으면 원본 표지 사용
      const coverUrl = fallbackCoverUrl || book.coverImageUrl || null;

      await addBook(
        {
          isbn: book.isbn13,
          title: book.title,
          author: book.author || null,
          publisher: book.publisher || null,
          published_date: book.publicationYear || null,
          cover_image_url: coverUrl,
        },
        "not_started"
      );

      toast.success(`"${book.title}"이(가) 내 서재에 추가되었습니다.`);
      onAdd?.(book.isbn13);
    } catch (error) {
      if (error instanceof Error && error.message.includes("이미 추가된")) {
        toast.info("이미 내 서재에 있는 책입니다.");
      } else {
        toast.error("책 추가에 실패했습니다.");
      }
    } finally {
      setIsAdding(false);
    }
  }, [book, onAdd, fallbackCoverUrl]);

  // 랭킹 배지 색상
  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return "bg-amber-500 text-white";
    if (ranking === 2) return "bg-slate-400 text-white";
    if (ranking === 3) return "bg-amber-700 text-white";
    return "bg-muted text-muted-foreground";
  };

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all duration-200 overflow-hidden",
        variant === "compact" && "w-[140px] sm:w-[160px] shrink-0"
      )}
    >
      <CardContent className="p-0">
        {/* 표지 이미지 */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
          {isFetchingCover ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mb-1" />
              <span className="text-xs text-muted-foreground">로딩 중...</span>
            </div>
          ) : hasValidImage ? (
            <Image
              src={getImageUrl(currentCoverUrl!)}
              alt={`${book.title} 표지`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 140px, 160px"
              onError={handleImageError}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50">
              <BookOpen className="w-8 h-8 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">이미지 없음</span>
            </div>
          )}

          {/* 랭킹 배지 (좌상단) */}
          <div
            className={cn(
              "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
              getRankingColor(book.ranking)
            )}
          >
            {book.ranking}
          </div>

          {/* 트렌딩/마니아 배지 (우상단) */}
          {(showTrending || showMania) && (
            <div className="absolute top-2 right-2">
              {showTrending && (
                <Badge
                  variant="destructive"
                  className="text-[10px] px-1.5 py-0.5 gap-0.5"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span className="hidden sm:inline">급상승</span>
                </Badge>
              )}
              {showMania && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                >
                  <Sparkles className="w-3 h-3" />
                  <span className="hidden sm:inline">추천</span>
                </Badge>
              )}
            </div>
          )}

          {/* 서재 추가 버튼 (호버 시 표시) */}
          {showAddButton && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1"
                onClick={handleAddToLibrary}
                disabled={isAdding}
              >
                <Plus className="w-4 h-4" />
                {isAdding ? "추가 중..." : "내 서재에 추가"}
              </Button>
            </div>
          )}
        </div>

        {/* 도서 정보 */}
        <div className="p-2 sm:p-3 space-y-1">
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight">
            {book.title}
          </h3>
          {book.author && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
              {book.author}
            </p>
          )}

          {/* 대출 횟수 (variant=full 일 때만) */}
          {variant === "full" && book.loanCount > 0 && (
            <p className="text-[10px] text-muted-foreground">
              대출 {book.loanCount.toLocaleString()}회
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const PopularBookCard = memo(PopularBookCardComponent);
