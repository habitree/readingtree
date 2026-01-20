"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookStatusBadge } from "./book-status-badge";
import { BookTitle } from "./book-title";
import { BookDeleteButton } from "./book-delete-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookOpen, Users } from "lucide-react";
import type { BookWithUserBook, ReadingStatus } from "@/types/book";
import type { BookWithNotes } from "@/app/actions/books";

interface BookCardProps {
  book: BookWithUserBook;
  userBookId: string;
  status: ReadingStatus;
  groupBooks?: BookWithNotes["groupBooks"];
  isSample?: boolean;
}

/**
 * 책 카드 컴포넌트
 * 책 목록에서 사용되는 카드 형태의 책 정보 표시
 */
export function BookCard({ book, userBookId, status, groupBooks, isSample: isSampleProp = false }: BookCardProps) {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2; // 최대 2번 재시도
  const hasValidImage = isValidImageUrl(book.cover_image_url) && book.cover_image_url && !imageError;
  // isSample은 prop으로 전달되거나 userBookId가 sample-로 시작하는 경우
  const isSample = isSampleProp || userBookId?.startsWith("sample-") || false;
  
  // userBookId 검증
  if (!userBookId || typeof userBookId !== 'string' || userBookId.trim() === '') {
    console.error('BookCard: userBookId가 유효하지 않습니다.', { userBookId, book });
    return null;
  }

  const handleImageError = () => {
    if (retryCount < MAX_RETRIES) {
      // 재시도: 짧은 지연 후 이미지 다시 로드 시도
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageError(false);
      }, 500 * (retryCount + 1)); // 지수 백오프: 500ms, 1000ms
    } else {
      // 최대 재시도 횟수 초과 시 에러 상태로 설정
      setImageError(true);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 디버깅: 클릭 시 userBookId 확인
    console.log("BookCard: 책 클릭", {
      userBookId,
      bookTitle: book.title,
      href: `/books/${userBookId}`,
      isSample,
    });
  };

  return (
    <div className="relative group">
      <Link
        href={`/books/${userBookId}`}
        onClick={handleClick}
        aria-label={`${book.title} 상세 보기`}
      >
        <Card
          className="hover:shadow-lg transition-shadow h-full cursor-pointer"
        >
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted" role="img" aria-label={`${book.title} 표지`}>
              {hasValidImage ? (
                <Image
                  key={`${book.cover_image_url}-retry-${retryCount}`}
                  src={getImageUrl(book.cover_image_url)}
                  alt={`${book.title} 표지`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                  onError={handleImageError}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50" aria-label="이미지 없음">
                  <BookOpen className="w-8 h-8 text-muted-foreground mb-1" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">이미지 없음</span>
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 flex-1 leading-tight">
                  <BookTitle title={book.title} />
                </h3>
                <BookStatusBadge status={status} className="shrink-0 scale-75 sm:scale-90" />
              </div>
              {book.author && (
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  {book.author}
                </p>
              )}
              {book.publisher && (
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 opacity-75">
                  {book.publisher}
                </p>
              )}
              {groupBooks && groupBooks.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-1.5 sm:mt-2">
                  {groupBooks.map((gb) => (
                    <Badge
                      key={gb.group_id}
                      variant="secondary"
                      className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5"
                      title={`${gb.group_name} 지정도서`}
                    >
                      <Users className="mr-0.5 sm:mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5" />
                      <span className="line-clamp-1">{gb.group_name}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
      {/* 삭제 버튼 - 호버 시 표시 (샘플 데이터 제외) */}
      {!isSample && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
          <BookDeleteButton
            userBookId={userBookId}
            bookTitle={book.title}
            variant="icon"
          />
        </div>
      )}
    </div>
  );
}

