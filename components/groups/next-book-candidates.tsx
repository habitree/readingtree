"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getRecommendedBooksForGroup } from "@/app/actions/popular-books";
import { addGroupBook } from "@/app/actions/groups";
import { ensureBook } from "@/app/actions/books";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { toast } from "sonner";
import {
  BookOpen,
  Sparkles,
  Plus,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendedBook } from "@/lib/api/data4library-types";

interface NextBookCandidatesProps {
  groupId: string;
  /** 리더/부리더 여부 (지정도서 추가 권한) */
  canAddBooks?: boolean;
}

/**
 * 다음 책 후보 컴포넌트
 * 현재 지정도서 ISBN 기반 추천도서 표시
 */
export function NextBookCandidates({
  groupId,
  canAddBooks = false,
}: NextBookCandidatesProps) {
  const [books, setBooks] = useState<RecommendedBook[]>([]);
  const [sourceBookTitle, setSourceBookTitle] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingIsbn, setAddingIsbn] = useState<string | null>(null);
  const [addedIsbns, setAddedIsbns] = useState<Set<string>>(new Set());

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getRecommendedBooksForGroup(groupId, 5);

      if (result.error) {
        setError(result.error);
        setBooks([]);
      } else {
        setBooks(result.books);
        setSourceBookTitle(result.sourceBookTitle);
      }
    } catch (err) {
      setError("추천 도서를 불러올 수 없습니다.");
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleAddAsGroupBook = useCallback(
    async (book: RecommendedBook) => {
      if (!book.isbn13) {
        toast.error("ISBN 정보가 없어 추가할 수 없습니다.");
        return;
      }

      setAddingIsbn(book.isbn13);

      try {
        // 먼저 책이 DB에 있는지 확인하고 없으면 생성
        const { bookId } = await ensureBook({
          isbn: book.isbn13,
          title: book.title,
          author: book.author || null,
          publisher: book.publisher || null,
          published_date: book.publicationYear || null,
          cover_image_url: book.coverImageUrl || null,
        });

        // 그룹 지정도서로 추가
        await addGroupBook(groupId, bookId);

        toast.success(`"${book.title}"이(가) 지정도서로 추가되었습니다.`);
        setAddedIsbns((prev) => new Set([...prev, book.isbn13]));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("이미")) {
            toast.info("이미 지정도서로 등록된 책입니다.");
            setAddedIsbns((prev) => new Set([...prev, book.isbn13]));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error("지정도서 추가에 실패했습니다.");
        }
      } finally {
        setAddingIsbn(null);
      }
    },
    [groupId]
  );

  // 데이터가 없고 에러도 없으면 표시하지 않음
  if (!isLoading && !error && books.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base">다음 책 후보</CardTitle>
          </div>
          {!isLoading && books.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={loadRecommendations}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {sourceBookTitle && (
          <p className="text-xs text-muted-foreground">
            "{sourceBookTitle}" 기반 추천
          </p>
        )}
      </CardHeader>

      <CardContent>
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-24 shrink-0">
                <Skeleton className="aspect-[3/4] w-full rounded" />
                <Skeleton className="h-3 w-full mt-1.5" />
              </div>
            ))}
          </div>
        )}

        {/* 에러 상태 */}
        {!isLoading && error && (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* 추천 도서 목록 */}
        {!isLoading && !error && books.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {books.map((book) => (
              <NextBookCard
                key={book.isbn13}
                book={book}
                canAdd={canAddBooks}
                isAdding={addingIsbn === book.isbn13}
                isAdded={addedIsbns.has(book.isbn13)}
                onAdd={handleAddAsGroupBook}
              />
            ))}
          </div>
        )}

        {/* 출처 안내 */}
        {!isLoading && books.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center mt-3">
            출처: 도서관 정보나루 추천 API
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// 미니 카드 컴포넌트
// ============================================

interface NextBookCardProps {
  book: RecommendedBook;
  canAdd: boolean;
  isAdding: boolean;
  isAdded: boolean;
  onAdd: (book: RecommendedBook) => void;
}

function NextBookCard({
  book,
  canAdd,
  isAdding,
  isAdded,
  onAdd,
}: NextBookCardProps) {
  const [imageError, setImageError] = useState(false);

  const hasValidImage =
    isValidImageUrl(book.coverImageUrl) && book.coverImageUrl && !imageError;

  return (
    <div className="w-24 shrink-0 group">
      {/* 표지 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-muted">
        {hasValidImage ? (
          <Image
            src={getImageUrl(book.coverImageUrl!)}
            alt={`${book.title} 표지`}
            fill
            className="object-cover"
            sizes="96px"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
        )}

        {/* 추가 버튼 (호버 시) */}
        {canAdd && !isAdded && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => onAdd(book)}
              disabled={isAdding}
            >
              <Plus className="h-3 w-3" />
              {isAdding ? "..." : "추가"}
            </Button>
          </div>
        )}

        {/* 추가됨 배지 */}
        {isAdded && (
          <div className="absolute top-1 right-1">
            <Badge
              variant="secondary"
              className="h-5 w-5 p-0 flex items-center justify-center bg-green-500 text-white"
            >
              <Check className="h-3 w-3" />
            </Badge>
          </div>
        )}

        {/* 추천 점수 배지 */}
        {book.recommendScore && book.recommendScore > 70 && (
          <div className="absolute bottom-1 left-1">
            <Badge
              variant="secondary"
              className="text-[9px] px-1 py-0 bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
            >
              {book.recommendScore}%
            </Badge>
          </div>
        )}
      </div>

      {/* 제목 */}
      <p className="text-[10px] text-center mt-1.5 line-clamp-2 leading-tight">
        {book.title}
      </p>
    </div>
  );
}
