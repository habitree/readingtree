"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import type { ReadingStatus } from "@/types/book";

interface BookListViewProps {
  books: Array<{
    id: string;
    status: ReadingStatus;
    books: {
      id: string;
      isbn: string | null;
      title: string;
      author: string | null;
      publisher: string | null;
      published_date: string | null;
      cover_image_url: string | null;
    };
    groupBooks?: Array<{
      group_id: string;
      group_name: string;
      group_leader_id: string;
    }>;
  }>;
  isLoading?: boolean;
}

/**
 * 읽기 상태를 한글로 변환
 */
function getStatusLabel(status: ReadingStatus): string {
  switch (status) {
    case "not_started":
      return "읽을 예정";
    case "reading":
      return "읽는 중";
    case "completed":
      return "완독";
    case "rereading":
      return "재독";
    case "paused":
      return "쉬는 중";
    default:
      return status;
  }
}

/**
 * 상태별 뱃지 스타일
 */
function getStatusBadgeVariant(
  status: ReadingStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "reading":
    case "rereading":
      return "default";
    case "completed":
      return "secondary";
    case "paused":
      return "destructive";
    default:
      return "outline";
  }
}

/**
 * 모바일용 책 리스트 뷰 컴포넌트
 * 한 줄에 책 1개: [표지] [제목/저자] [상태]
 * 테이블 뷰의 모바일 대체 버전
 */
export function BookListView({ books, isLoading }: BookListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton className="w-12 h-16 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">등록된 책이 없습니다</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            첫 번째 책을 추가하고 독서 여정을 시작해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {books.map((userBook) => {
        if (!userBook.id || typeof userBook.id !== "string") {
          return null;
        }

        const book = userBook.books;
        const hasValidImage =
          isValidImageUrl(book.cover_image_url) && book.cover_image_url;

        return (
          <Link
            key={userBook.id}
            href={`/books/${userBook.id}`}
            className="block"
          >
            <div
              className={cn(
                "flex items-center gap-3 p-3 border rounded-lg",
                "bg-background hover:bg-muted/50 transition-colors",
                "active:bg-muted/70"
              )}
            >
              {/* 표지 이미지 */}
              <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                {hasValidImage ? (
                  <Image
                    src={getImageUrl(book.cover_image_url)}
                    alt={`${book.title} 표지`}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* 제목 및 저자 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1">
                  {book.title}
                </h3>
                {book.author && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {book.author.replace(/\^/g, ", ")}
                  </p>
                )}
                {/* 그룹 뱃지 (있는 경우) */}
                {userBook.groupBooks && userBook.groupBooks.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {userBook.groupBooks.slice(0, 1).map((gb) => (
                      <Badge
                        key={gb.group_id}
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4"
                      >
                        {gb.group_name}
                      </Badge>
                    ))}
                    {userBook.groupBooks.length > 1 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{userBook.groupBooks.length - 1}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 상태 뱃지 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant={getStatusBadgeVariant(userBook.status)}
                  className="text-[10px] px-2 py-0.5"
                >
                  {getStatusLabel(userBook.status)}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
