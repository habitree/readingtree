"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { NoteWithBook } from "@/types/note";
import { BookOpen, TrendingUp, Clock, BookMarked } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ProgressEntry {
  id: string;
  pageNumber: number | null;
  memo: string | null;
  createdAt: string;
}

interface BookProgressGroup {
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  bookCoverUrl: string | null;
  entries: ProgressEntry[];
}

interface SearchProgressGroupProps {
  dateKey: string;
  bookGroups: BookProgressGroup[];
}

function extractMemo(content: string | null): string | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return parsed?.memo || null;
  } catch {
    return content;
  }
}

function parsePageNum(pageNumber: string | null): number | null {
  if (!pageNumber) return null;
  const num = parseInt(pageNumber, 10);
  return isNaN(num) ? null : num;
}

/**
 * 검색 결과에서 진행기록을 날짜별로 그룹화하여 표시
 */
export function SearchProgressGroup({ dateKey, bookGroups }: SearchProgressGroupProps) {
  const { t } = useTranslation();
  const dateObj = new Date(dateKey);
  const dateLabel = format(dateObj, "M월 d일 (EEE)", { locale: ko });
  const totalEntries = bookGroups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <Card className="overflow-hidden border-teal-200/40 dark:border-teal-800/40 bg-gradient-to-br from-teal-50/30 to-white dark:from-teal-950/20 dark:to-background">
      <CardContent className="p-0">
        {/* 날짜 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-teal-100/60 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                {dateLabel}
              </p>
              <p className="text-[11px] text-teal-600/70 dark:text-teal-400/70">
                {t("search.progressCount", { count: totalEntries })}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-teal-100/80 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-0 text-xs"
          >
            {t("search.progressLabel")}
          </Badge>
        </div>

        {/* 책별 그룹 */}
        <div className="divide-y divide-teal-100/40 dark:divide-teal-900/30">
          {bookGroups.map((group) => (
            <BookProgressSection key={group.bookId} group={group} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BookProgressSection({ group }: { group: BookProgressGroup }) {
  const hasBookCover = group.bookCoverUrl && isValidImageUrl(group.bookCoverUrl);
  const sortedEntries = [...group.entries].sort((a, b) => {
    const pageA = a.pageNumber ?? 0;
    const pageB = b.pageNumber ?? 0;
    return pageA - pageB;
  });

  // 페이지 범위 계산
  const pages = sortedEntries
    .map((e) => e.pageNumber)
    .filter((p): p is number => p !== null);
  const minPage = pages.length > 0 ? Math.min(...pages) : null;
  const maxPage = pages.length > 0 ? Math.max(...pages) : null;

  return (
    <div className="px-4 py-3">
      {/* 책 정보 헤더 */}
      <div className="flex items-center gap-3 mb-3">
        {/* 미니 책 커버 */}
        <div className="relative w-10 h-14 sm:w-12 sm:h-16 shrink-0 overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
          {hasBookCover ? (
            <Image
              src={getImageUrl(group.bookCoverUrl!)}
              alt={group.bookTitle}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-slate-300 dark:text-slate-600" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground line-clamp-1">
            {group.bookTitle}
          </p>
          {group.bookAuthor && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {group.bookAuthor}
            </p>
          )}
          {/* 페이지 범위 요약 */}
          {minPage !== null && maxPage !== null && (
            <div className="flex items-center gap-1.5 mt-1">
              <BookMarked className="h-3 w-3 text-teal-500" />
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                {minPage === maxPage
                  ? `p.${minPage}`
                  : `p.${minPage} → p.${maxPage}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 개별 진행 기록 리스트 */}
      <div className="space-y-1.5 ml-1">
        {sortedEntries.map((entry) => (
          <Link
            key={entry.id}
            href={`/notes/${entry.id}`}
            className="group/entry block"
          >
            <div className="flex items-center gap-2.5 py-1.5 px-2.5 -mx-1 rounded-lg hover:bg-teal-50/80 dark:hover:bg-teal-950/40 transition-colors">
              {/* 페이지 번호 뱃지 */}
              <div className={cn(
                "shrink-0 w-12 h-7 rounded-md flex items-center justify-center text-xs font-bold",
                "bg-teal-100/70 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300"
              )}>
                {entry.pageNumber ? `p.${entry.pageNumber}` : "-"}
              </div>

              {/* 메모 */}
              <div className="flex-1 min-w-0">
                {entry.memo ? (
                  <p className="text-xs text-foreground/80 line-clamp-1">
                    {entry.memo}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">
                    메모 없음
                  </p>
                )}
              </div>

              {/* 시간 */}
              <span className="shrink-0 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Clock className="h-2.5 w-2.5" />
                {format(new Date(entry.createdAt), "HH:mm")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * 진행기록 노트 배열을 날짜별 > 책별로 그룹화
 */
export function groupProgressNotes(
  notes: NoteWithBook[]
): { dateKey: string; bookGroups: BookProgressGroup[] }[] {
  const dateMap = new Map<string, Map<string, { group: BookProgressGroup; entries: ProgressEntry[] }>>();

  for (const note of notes) {
    if (note.type !== "progress") continue;

    const dateKey = format(new Date(note.created_at), "yyyy-MM-dd");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const noteAny = note as any;
    const bookData = Array.isArray(noteAny.books)
      ? noteAny.books[0]
      : noteAny.books || noteAny.book;
    const book = bookData as { id?: string; title?: string; author?: string | null; cover_image_url?: string | null } | undefined;
    const bookId = book?.id || note.book_id || "unknown";

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, new Map());
    }
    const bookMap = dateMap.get(dateKey)!;

    if (!bookMap.has(bookId)) {
      bookMap.set(bookId, {
        group: {
          bookId,
          bookTitle: book?.title || "제목 없음",
          bookAuthor: book?.author || null,
          bookCoverUrl: book?.cover_image_url || null,
          entries: [],
        },
        entries: [],
      });
    }

    const entry: ProgressEntry = {
      id: note.id,
      pageNumber: parsePageNum(note.page_number),
      memo: extractMemo(note.content),
      createdAt: note.created_at,
    };

    bookMap.get(bookId)!.entries.push(entry);
  }

  // 날짜 내림차순 정렬
  const result: { dateKey: string; bookGroups: BookProgressGroup[] }[] = [];
  const sortedDates = [...dateMap.keys()].sort((a, b) => b.localeCompare(a));

  for (const dateKey of sortedDates) {
    const bookMap = dateMap.get(dateKey)!;
    const bookGroups: BookProgressGroup[] = [];

    for (const { group, entries } of bookMap.values()) {
      bookGroups.push({ ...group, entries });
    }

    result.push({ dateKey, bookGroups });
  }

  return result;
}
