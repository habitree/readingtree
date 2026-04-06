"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { parsePageNumber } from "@/lib/utils/note";
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
 * 심플한 표지 + 내용 레이아웃
 */
export function TimelineItem({ note }: TimelineItemProps) {
  const Icon = typeIcons[note.type];
  const pageNumber = parsePageNumber(note.page_number);

  const bookData = (note as unknown as Record<string, unknown>).books || note.book;
  const book = Array.isArray(bookData) ? bookData[0] : bookData;
  const bookCoverImage = (book as Record<string, unknown> | null)?.cover_image_url as string | undefined;
  const hasBookCover = bookCoverImage && isValidImageUrl(bookCoverImage);

  return (
    <Link href={`/notes/${note.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-border/40">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3">
            {/* 표지 */}
            <div className="shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-lg overflow-hidden bg-muted/40">
              {hasBookCover ? (
                <Image
                  src={getImageUrl(bookCoverImage!)}
                  alt={(book as Record<string, unknown>)?.title as string || ""}
                  width={64}
                  height={88}
                  className="object-cover w-full h-full"
                />
              ) : note.image_url ? (
                <Image
                  src={getImageUrl(note.image_url)}
                  alt={note.type}
                  width={64}
                  height={88}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {pageNumber && (
                    <>
                      <span className="text-muted-foreground/40">&middot;</span>
                      <span>p.{pageNumber}</span>
                    </>
                  )}
                </div>
                <time className="text-[10px] text-muted-foreground/60" suppressHydrationWarning>
                  {formatSmartDate(note.created_at)}
                </time>
              </div>

              {book && typeof (book as Record<string, unknown>).title === "string" && (
                <p className="text-sm font-medium line-clamp-1 text-foreground/90">
                  {String((book as Record<string, unknown>).title)}
                </p>
              )}

              <div className="flex-1">
                <NoteContentViewer content={note.content} pageNumber={null} maxLength={80} compact />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
