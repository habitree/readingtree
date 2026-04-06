"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import type { NoteWithBook } from "@/types/note";
import { FileText, PenTool, Camera, StickyNote, BookOpen } from "lucide-react";

interface TimelineItemProps {
  note: NoteWithBook;
}

const typeIcons = {
  quote: FileText,
  transcription: PenTool,
  photo: Camera,
  memo: StickyNote,
  progress: BookOpen,
} as const;

/**
 * 타임라인 아이템 컴포넌트
 * NoteCard와 동일한 고정 높이 레이아웃
 */
export function TimelineItem({ note }: TimelineItemProps) {
  const Icon = typeIcons[note.type];
  const pageNumber = parsePageNumber(note.page_number);
  const isProgressType = note.type === "progress";
  const typeLabel = getNoteTypeLabel(note.type, !!note.image_url);

  const bookData = (note as unknown as Record<string, unknown>).books || note.book;
  const book = Array.isArray(bookData) ? bookData[0] : bookData;
  const bookCoverImage = (book as Record<string, unknown> | null)?.cover_image_url as string | undefined;
  const hasBookCover = bookCoverImage && isValidImageUrl(bookCoverImage);
  const bookTitle = book && typeof (book as Record<string, unknown>).title === "string"
    ? String((book as Record<string, unknown>).title)
    : null;

  const displayTitle = isProgressType ? bookTitle : (note.title || bookTitle);

  return (
    <Link href={`/notes/${note.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-border/40">
        <CardContent className="p-0">
          <div className="flex h-[104px] sm:h-[112px]">
            {/* 좌측: 표지 (고정 비율) */}
            <div className="shrink-0 w-[78px] sm:w-[84px]">
              <div className="relative w-full h-full overflow-hidden rounded-l-lg">
                {hasBookCover ? (
                  <Image
                    src={getImageUrl(bookCoverImage!)}
                    alt={bookTitle || ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 78px, 84px"
                  />
                ) : note.image_url ? (
                  <Image
                    src={getImageUrl(note.image_url)}
                    alt={note.type}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 78px, 84px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/40">
                    <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 내용 */}
            <div className="flex-1 min-w-0 p-2.5 sm:p-3 flex flex-col">
              {/* 상단: 타입 아이콘 + 메타 */}
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="font-medium">{typeLabel}</span>
                  {pageNumber && (
                    <>
                      <span className="text-muted-foreground/40">&middot;</span>
                      <span>p.{pageNumber}</span>
                    </>
                  )}
                </div>
                <time className="text-[10px] text-muted-foreground/50 shrink-0" suppressHydrationWarning>
                  {formatSmartDate(note.created_at)}
                </time>
              </div>

              {/* 제목 (1줄) */}
              {displayTitle && (
                <p className="text-[13px] sm:text-sm font-medium line-clamp-1 text-foreground/90 mb-0.5">
                  {displayTitle}
                </p>
              )}

              {/* 내용 미리보기 */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <NoteContentViewer content={note.content} pageNumber={null} maxLength={70} compact />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
