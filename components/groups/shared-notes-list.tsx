"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatSmartDate } from "@/lib/utils/date";
import { parseNoteContentFields, parsePageNumber } from "@/lib/utils/note";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { formatAuthor } from "@/lib/utils/book";
import {
  BookOpen,
  PenLine,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  FileText,
  Camera,
  ScanText,
  Quote,
  StickyNote,
} from "lucide-react";
import type { NoteWithBook } from "@/types/note";
import { useTranslation } from "@/lib/i18n";
import { spacing } from "@/lib/design-tokens";

interface SharedNotesListProps {
  notes: Array<{
    id: string;
    shared_at: string;
    notes: NoteWithBook & {
      users?: {
        id: string;
        name: string;
        avatar_url: string | null;
      };
      books?: {
        id: string;
        title: string;
        author: string | null;
        cover_image_url: string | null;
      };
    };
  }>;
  groupId?: string;
}

// --- 책별 그루핑 ---

interface BookGroup {
  bookId: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
  } | null;
  notes: SharedNotesListProps["notes"];
  latestSharedAt: string;
}

function groupNotesByBook(notes: SharedNotesListProps["notes"]): BookGroup[] {
  const groupMap = new Map<string, BookGroup>();

  for (const item of notes) {
    const book = item.notes.books || (item.notes as any).book;
    const bookId = book?.id || "_other";

    if (!groupMap.has(bookId)) {
      groupMap.set(bookId, {
        bookId,
        book: book || null,
        notes: [],
        latestSharedAt: item.shared_at,
      });
    }
    groupMap.get(bookId)!.notes.push(item);
    if (item.shared_at > groupMap.get(bookId)!.latestSharedAt) {
      groupMap.get(bookId)!.latestSharedAt = item.shared_at;
    }
  }

  return Array.from(groupMap.values()).sort(
    (a, b) =>
      new Date(b.latestSharedAt).getTime() -
      new Date(a.latestSharedAt).getTime()
  );
}

// 타입별 아이콘 매핑
const TYPE_ICONS: Record<string, typeof FileText> = {
  quote: Quote,
  memo: StickyNote,
  photo: Camera,
  transcription: ScanText,
};

// 타입별 라벨
const TYPE_LABELS: Record<string, string> = {
  quote: "인용구",
  memo: "메모",
  photo: "사진",
  transcription: "필사",
};

const COLLAPSE_THRESHOLD = 4;

/**
 * 공유 기록 목록 컴포넌트
 * 모임에 공유된 기록을 책별로 그룹화 → 컴팩트 카드로 표시
 */
export function SharedNotesList({ notes, groupId }: SharedNotesListProps) {
  const { t } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (notes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
              <PenLine className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-semibold mb-2">
              {t("groups.noSharedNotesEmpty")}
            </h4>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t("groups.noSharedNotesEmptyDesc")}
            </p>
            <Button variant="outline" asChild>
              <Link href={groupId ? `/groups/${groupId}?tab=books` : "#"}>
                <BookOpen className="mr-2 h-4 w-4" />
                {t("groups.viewDesignatedBooks")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const bookGroups = groupNotesByBook(notes);

  const toggleGroup = (bookId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  return (
    <div className={spacing.pageSection}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("groups.sharedNotesCount").replace("{count}", String(notes.length))}
        </p>
      </div>

      <div className="space-y-4">
        {bookGroups.map((group, groupIndex) => {
          const isExpanded = expandedGroups.has(group.bookId);
          const hasMore = group.notes.length > COLLAPSE_THRESHOLD;
          const visibleNotes = isExpanded
            ? group.notes
            : group.notes.slice(0, COLLAPSE_THRESHOLD);

          return (
            <Card
              key={group.bookId}
              className="overflow-hidden animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${groupIndex * 50}ms` }}
            >
              {/* 책 그룹 헤더 */}
              <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-muted/30">
                <Link
                  href={
                    group.book && groupId
                      ? `/groups/${groupId}/books/${group.book.id}`
                      : "#"
                  }
                  className="relative w-10 h-14 shrink-0 rounded-md overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow"
                >
                  {group.book?.cover_image_url &&
                  isValidImageUrl(group.book.cover_image_url) ? (
                    <Image
                      src={getImageUrl(group.book.cover_image_url)}
                      alt={group.book?.title || ""}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={
                      group.book && groupId
                        ? `/groups/${groupId}/books/${group.book.id}`
                        : "#"
                    }
                    className="hover:underline"
                  >
                    <p className="text-sm font-semibold truncate">
                      {group.book?.title || t("groups.otherBook")}
                    </p>
                  </Link>
                  {group.book?.author && (
                    <p className="text-xs text-muted-foreground truncate">
                      {formatAuthor(group.book.author)}
                    </p>
                  )}
                </div>

                <Badge variant="secondary" className="shrink-0 text-xs">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {t("groups.bookGroupCount").replace(
                    "{count}",
                    String(group.notes.length)
                  )}
                </Badge>
              </div>

              {/* 기록 카드 그리드 */}
              <div className="p-2 sm:p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {visibleNotes.map((item) => (
                  <SharedNoteCard key={item.id} item={item} />
                ))}
              </div>

              {/* 더보기/접기 버튼 */}
              {hasMore && (
                <div className="border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.bookId)}
                    className="w-full h-9 rounded-none text-xs text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
                        {t("groups.showLessNotes")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                        {t("groups.showMoreNotes").replace(
                          "{count}",
                          String(group.notes.length - COLLAPSE_THRESHOLD)
                        )}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// --- 컴팩트 카드형 기록 아이템 ---

function SharedNoteCard({
  item,
}: {
  item: SharedNotesListProps["notes"][number];
}) {
  const note = item.notes;
  const user = note.users;
  const hasImage = note.image_url && isValidImageUrl(note.image_url);
  const Icon = TYPE_ICONS[note.type] || FileText;
  const typeLabel = TYPE_LABELS[note.type] || "기록";
  const pageNumber = parsePageNumber(note.page_number);

  // content 파싱
  const { quote, memo } = parseNoteContentFields(note.content);
  const displayText = quote || memo || "";
  const trimmed = displayText.length > 60
    ? displayText.substring(0, 57) + "..."
    : displayText;

  // OCR 텍스트 (필사/사진에서 content가 없을 때)
  const ocrText = !displayText && note.transcription?.extracted_text
    ? (note.transcription.extracted_text.length > 60
        ? note.transcription.extracted_text.substring(0, 57) + "..."
        : note.transcription.extracted_text)
    : null;

  return (
    <Link href={`/notes/${note.id}`} className="block group">
      <div className="flex h-[88px] rounded-lg border border-border/40 overflow-hidden hover:shadow-sm hover:border-border/80 transition-all bg-card">
        {/* 좌측: 이미지 or 아이콘 */}
        <div className="shrink-0 w-[68px]">
          {hasImage ? (
            <div className="relative w-full h-full">
              <Image
                src={getImageUrl(note.image_url!)}
                alt={typeLabel}
                fill
                className="object-cover"
                sizes="68px"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/40">
              <Icon className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* 우측: 메타 + 내용 + 작성자 */}
        <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
          {/* 상단: 타입 + 페이지 + 날짜 */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground min-w-0">
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
              {formatSmartDate(item.shared_at)}
            </time>
          </div>

          {/* 중간: 내용 미리보기 */}
          <div className="flex-1 min-h-0 overflow-hidden mt-0.5">
            {(trimmed || ocrText) && (
              <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                {trimmed || ocrText}
              </p>
            )}
          </div>

          {/* 하단: 작성자 */}
          {user && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <Avatar className="h-4 w-4">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-[8px]">
                  {user.name?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] text-muted-foreground truncate">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
