"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageSquare,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { formatAuthor } from "@/lib/utils/book";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import type { ReadingStatus } from "@/types/book";
import { useTranslation } from "@/lib/i18n";

interface GroupBookCardEnhancedProps {
  groupId: string;
  groupBook: {
    id: string;
    book_id: string;
    books: {
      id: string;
      title: string;
      author: string | null;
      cover_image_url: string | null;
    };
    isInMyLibrary?: boolean;
    myStatus?: string | null;
    recentContributors?: { id: string; name: string; avatar_url: string | null }[];
  };
  noteCount: number;
  onAddToLibrary?: (bookId: string) => void;
  onDelete?: () => void;
}

export function GroupBookCardEnhanced({
  groupId,
  groupBook,
  noteCount,
  onAddToLibrary,
  onDelete,
}: GroupBookCardEnhancedProps) {
  const { t } = useTranslation();
  const book = groupBook.books;
  const [imgError, setImgError] = useState(false);
  if (!book) return null;

  const hasValidImage = isValidImageUrl(book.cover_image_url) && !imgError;

  return (
    <div className="relative group">
      <Card className="overflow-hidden h-full hover:shadow-md transition-shadow">
        <Link href={`/groups/${groupId}/books/${book.id}`}>
          <div className="relative aspect-[3/4] w-full bg-muted">
            {hasValidImage ? (
              <Image
                src={getImageUrl(book.cover_image_url)}
                alt={book.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 25vw, 20vw"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground text-center line-clamp-2">{book.title}</span>
              </div>
            )}

            {/* 기록 수 배지 */}
            <div className="absolute top-1 right-1">
              <Badge
                variant={noteCount > 0 ? "default" : "secondary"}
                className="flex items-center gap-0.5 text-[10px] px-1.5 py-0 h-5 shadow-sm"
              >
                <MessageSquare className="h-2.5 w-2.5" />
                {noteCount}
              </Badge>
            </div>

            {/* 최근 기록자 아바타 */}
            {groupBook.recentContributors && groupBook.recentContributors.length > 0 && (
              <div className="absolute bottom-1 left-1 flex -space-x-1">
                {groupBook.recentContributors.map((contributor) => (
                  <Avatar key={contributor.id} className="h-5 w-5 ring-1 ring-background">
                    <AvatarImage src={contributor.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{contributor.name?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </Link>

        <div className="p-2 sm:p-3">
          <Link href={`/groups/${groupId}/books/${book.id}`}>
            <h4 className="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight hover:text-primary transition-colors">
              {book.title}
            </h4>
          </Link>
          {book.author && (
            <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {formatAuthor(book.author)}
            </p>
          )}

          {/* 내 서재 상태 */}
          <div className="flex items-center gap-1 mt-1.5">
            {groupBook.isInMyLibrary ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0" />
                {groupBook.myStatus && (
                  <BookStatusBadge status={groupBook.myStatus as ReadingStatus} className="scale-[0.8] sm:scale-100 origin-left" />
                )}
              </>
            ) : (
              onAddToLibrary && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-[10px] sm:text-xs h-6 sm:h-7"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAddToLibrary(book.id);
                  }}
                >
                  <Plus className="mr-0.5 h-3 w-3" />
                  {t("groups.addToMyLibrary")}
                </Button>
              )
            )}
          </div>
        </div>
      </Card>

      {/* 삭제 버튼 (리더만, 호버 시 표시) */}
      {onDelete && (
        <button
          className="absolute top-0.5 left-0.5 z-10 p-1 rounded-full bg-destructive/80 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          title={t("groups.deleteDesignatedBook")}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
