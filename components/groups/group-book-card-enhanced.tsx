"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
  Plus,
} from "lucide-react";
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
  };
  noteCount: number;
  onAddToLibrary?: (bookId: string) => void;
}

export function GroupBookCardEnhanced({
  groupId,
  groupBook,
  noteCount,
  onAddToLibrary,
}: GroupBookCardEnhancedProps) {
  const { t } = useTranslation();
  const book = groupBook.books;
  if (!book) return null;

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200">
      <Link href={`/groups/${groupId}/books/${book.id}`}>
        <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-muted to-muted/50">
          {isValidImageUrl(book.cover_image_url) ? (
            <Image
              src={getImageUrl(book.cover_image_url)}
              alt={book.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* 기록 수 배지 - 항상 표시 */}
          <div className="absolute top-2 right-2">
            <Badge
              variant={noteCount > 0 ? "default" : "secondary"}
              className="flex items-center gap-1 shadow-md"
            >
              <MessageSquare className="h-3 w-3" />
              {noteCount}
            </Badge>
          </div>

          {/* 호버 오버레이 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-2">
              <ChevronRight className="h-6 w-6" />
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="p-3 md:p-4">
        <div className="space-y-2">
          <Link href={`/groups/${groupId}/books/${book.id}`}>
            <h4 className="font-semibold line-clamp-2 text-sm md:text-base hover:text-primary transition-colors">
              {book.title}
            </h4>
          </Link>
          {book.author && (
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {book.author}
            </p>
          )}

          {/* 내 서재 상태 */}
          {groupBook.isInMyLibrary ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t("groups.inMyLibrary")}
              </Badge>
              {groupBook.myStatus && (
                <BookStatusBadge status={groupBook.myStatus as ReadingStatus} />
              )}
            </div>
          ) : (
            onAddToLibrary && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs h-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddToLibrary(book.id);
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                {t("groups.addToMyLibrary")}
              </Button>
            )
          )}

          {/* 공유 기록 보기 버튼 */}
          <Link
            href={`/groups/${groupId}/books/${book.id}`}
            className="block w-full"
          >
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs h-8 hover:bg-primary/10"
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              {noteCount > 0
                ? t("groups.viewNotesCount").replace("{count}", String(noteCount))
                : t("groups.viewNotes")}
              <ChevronRight className="ml-auto h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
