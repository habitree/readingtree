import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { cn } from "@/lib/utils";
import type { NoteWithBook } from "@/types/note";
import { FileText, PenTool, Camera, ImageIcon, BookOpen, TrendingUp } from "lucide-react";
import { highlightText } from "@/lib/utils/search";

interface SearchResultCardProps {
  note: NoteWithBook;
  searchQuery?: string;
}

/**
 * 검색 결과 카드 컴포넌트
 * 검색어 하이라이트 기능 포함
 */
export function SearchResultCard({ note, searchQuery }: SearchResultCardProps) {
  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: ImageIcon,
    progress: TrendingUp,
  };

  const hasImage = !!note.image_url;
  const typeLabel = getNoteTypeLabel(note.type, hasImage);
  const Icon = typeIcons[note.type];

  // books가 배열인 경우 첫 번째 요소 사용, 객체인 경우 그대로 사용
  const bookData = (note as any).books || note.book;
  const book = Array.isArray(bookData) ? bookData[0] : bookData;
  const bookCoverImage = book?.cover_image_url;
  const hasBookCover = bookCoverImage && isValidImageUrl(bookCoverImage);

  // user_books 정보 확인 (읽는이유 검색 시 표시용)
  const userBookData = (note as any).user_books;
  const userBook = Array.isArray(userBookData) ? userBookData[0] : userBookData;
  const readingReason = userBook?.reading_reason;
  
  // 검색어가 읽는이유와 매칭되는지 확인
  const isReadingReasonMatch = searchQuery && readingReason && 
    readingReason.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <Link href={`/notes/${note.id}`} className="group">
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full overflow-hidden border-slate-200/60 dark:border-slate-800">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* 책 표지 이미지와 기록 이미지 겹치기 - 타임라인과 동일한 스타일 */}
            <div className={cn("relative shrink-0", hasImage && "mb-4 mr-4")}>
              {/* 책 표지 이미지 - 배경 레이어 */}
              {book ? (
                <div className="relative w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-[1.02]">
                  {hasBookCover ? (
                    <Image
                      src={getImageUrl(bookCoverImage!)}
                      alt={book.title || "책 표지"}
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

              {/* 기록 이미지가 있는 경우에만 전면 레이어 표시 */}
              {note.image_url && (
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

              {/* 기록 이미지가 없는 경우 아이콘 표시 */}
              {!note.image_url && (
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 w-20 h-28 sm:w-24 sm:h-32 z-10 flex items-center justify-center">
                  <div className="w-full h-full flex items-center justify-center rounded-lg bg-white/80 dark:bg-slate-900/80 border-2 border-white dark:border-slate-800">
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary">{typeLabel}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatSmartDate(note.created_at)}
                </span>
              </div>

              {/* 책 정보 - 타임라인과 동일한 스타일 */}
              {/* 읽는이유가 검색어와 매칭되거나 책 정보가 있는 경우 표시 */}
              {(book || isReadingReasonMatch) ? (
                <div className="space-y-1 pb-1 border-b">
                  {book && (
                    <>
                      <p className="text-base font-bold line-clamp-1 text-foreground">
                        {book.title || "제목 없음"}
                      </p>
                      {book.author && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {book.author}
                        </p>
                      )}
                    </>
                  )}
                  {/* 읽는이유가 검색어와 매칭된 경우 표시 */}
                  {isReadingReasonMatch && readingReason && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-xs">읽는 이유</Badge>
                        <span className="text-xs text-primary font-medium">검색 매칭</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 bg-primary/10 p-2 rounded border border-primary/20">
                        {readingReason}
                      </p>
                    </div>
                  )}
                  {/* 읽는이유가 있지만 검색어와 매칭되지 않은 경우 (선택적 표시) */}
                  {!isReadingReasonMatch && readingReason && book && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        읽는 이유: {readingReason}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pb-1 border-b">
                  <p className="text-sm text-muted-foreground italic">책 정보 없음</p>
                </div>
              )}

              <NoteContentViewer
                content={note.content}
                pageNumber={parsePageNumber(note.page_number)}
                maxLength={100}
              />

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={`${tag}-${index}`} variant="outline" className="text-xs">
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
}

