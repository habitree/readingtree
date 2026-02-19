"use client";

import { useState, useEffect } from "react";
import { getUserBooks } from "@/app/actions/books";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/image";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface RelatedBooksPreviewProps {
  relatedBookIds: string[] | null;
}

/**
 * 기록 수정 페이지에서 연결된 책의 표지 이미지를 표시하는 컴포넌트
 */
export function RelatedBooksPreview({
  relatedBookIds,
}: RelatedBooksPreviewProps) {
  const { t } = useTranslation();
  const [relatedBooks, setRelatedBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (relatedBookIds && relatedBookIds.length > 0) {
      loadRelatedBooks();
    } else {
      setRelatedBooks([]);
    }
  }, [relatedBookIds]);

  const loadRelatedBooks = async () => {
    if (!relatedBookIds || relatedBookIds.length === 0) return;

    setIsLoading(true);
    try {
      const result = await getUserBooks();
      // getUserBooks는 배열을 반환하므로 직접 사용
      const filtered = (result || []).filter((book: any) =>
        relatedBookIds.includes(book.id)
      );
      setRelatedBooks(filtered);
    } catch (error) {
      console.error("관련 책 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!relatedBookIds || relatedBookIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("notes.linkedBooksLoading")}
      </div>
    );
  }

  if (relatedBooks.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("notes.linkedBooksUnavailable")}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{t("notes.linkedBooksCountPreview", { count: relatedBooks.length })}</h4>
      <div className="flex flex-wrap gap-3">
        {relatedBooks.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="group relative"
          >
            <Card className="w-20 h-28 overflow-hidden border transition-all hover:shadow-md hover:scale-105">
              <CardContent className="p-0 h-full">
                <div className="relative w-full h-full">
                  <Image
                    src={getImageUrl(book.books?.cover_image_url || "/placeholder-book.png")}
                    alt={book.books?.title || t("notes.bookAlt")}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {/* 호버 시 책 제목 표시 */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-xs text-white text-center font-medium line-clamp-2">
                      {book.books?.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
