"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { cn } from "@/lib/utils";
import { formatAuthor } from "@/lib/utils/book";
import { BookOpen } from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import { useTranslation } from "@/lib/i18n";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";

interface RecentNotesProps {
  notes: NoteWithBook[];
}

/**
 * 최근 기록 컴포넌트
 * 최근 작성한 기록 목록 표시
 * 타임라인 스타일로 표시
 */
export function RecentNotes({ notes }: RecentNotesProps) {
  const { t } = useTranslation();

  return (
    // 8dp 그리드 시스템: space-y-3 = 12px 간격
    <div className="space-y-3">
      {notes.map((note) => {
        const hasImage = !!note.image_url;
        const typeLabel = getNoteTypeLabel(note.type, hasImage);

        // books가 배열인 경우 첫 번째 요소 사용, 객체인 경우 그대로 사용
        // Supabase 조인 결과가 `books` 키로 올 수 있으므로 처리
        const bookData = (note as any).books || note.book;
        const book = Array.isArray(bookData) ? bookData[0] : bookData;
        const isReadtreeNote = note.book_id === READTREE_BOOK_ID;
        const bookCoverImage = book?.cover_image_url;
        const hasBookCover = bookCoverImage && isValidImageUrl(bookCoverImage);

        // Readtree 기록: note.image_url을 단일 레이어로 표시 (겹침 불필요)
        const showOverlay = hasImage && !isReadtreeNote;

        return (
          <Link key={note.id} href={`/notes/${note.id}`} className="group">
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-slate-200/60 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* 책 표지 이미지와 기록 이미지 겹치기 - UX 원칙 05: 깊이감 부여 */}
                  <div className={cn("relative shrink-0", showOverlay && "mb-4 mr-4")}>
                    {isReadtreeNote && hasImage ? (
                      /* Readtree 기록: note.image_url 단일 레이어 */
                      <div className="relative w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-[1.02]">
                        <Image
                          src={getImageUrl(note.image_url!)}
                          alt={t("notes.freeNote")}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 80px, 96px"
                        />
                      </div>
                    ) : book ? (
                      /* 일반 책: 책 표지 배경 레이어 */
                      <div className="relative w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-[1.02]">
                        {hasBookCover ? (
                          <Image
                            src={getImageUrl(bookCoverImage!)}
                            alt={book.title || t("books.coverAlt")}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 80px, 96px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-lg bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
                      </div>
                    )}

                    {/* 기록 이미지가 있는 경우에만 전면 레이어 표시 (Readtree 기록 제외) */}
                    {showOverlay && note.image_url && (
                      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-20 h-28 sm:w-24 sm:h-32 z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
                        <div className="relative w-full h-full overflow-hidden rounded-lg bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 shadow-[10px_10px_25px_-10px_rgba(0,0,0,0.3)]">
                          <Image
                            src={getImageUrl(note.image_url)}
                            alt={note.type}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 80px, 96px"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary">{typeLabel}</Badge>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {formatSmartDate(note.created_at)}
                      </span>
                    </div>

                    {/* 책 정보 - 더 명확하게 표시 */}
                    {book ? (
                      <div className="space-y-1 pb-1 border-b">
                        <p className="text-base font-bold line-clamp-1 text-foreground">
                          {isReadtreeNote ? t("notes.freeNote") : (book.title || t("books.noTitle"))}
                        </p>
                        {!isReadtreeNote && book.author && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {formatAuthor(book.author)}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="pb-1 border-b">
                        <p className="text-sm text-muted-foreground italic">{t("books.noBookInfo")}</p>
                      </div>
                    )}

                    {/* 기록 제목 (있는 경우) */}
                    {note.title && (
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                        {note.title}
                      </h3>
                    )}

                    <NoteContentViewer
                      content={note.content}
                      pageNumber={parsePageNumber(note.page_number)}
                      maxLength={100}
                    />

                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
