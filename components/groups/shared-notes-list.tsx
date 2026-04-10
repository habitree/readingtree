"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatSmartDate } from "@/lib/utils/date";
import { parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import {
  BookOpen,
  PenLine,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import { NOTE_TYPE_STYLES } from "@/lib/constants/note-type-styles";
import type { NoteStyleType } from "@/lib/constants/note-type-styles";
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
    // 최신 shared_at 갱신
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

// --- 접기/펼치기 임계값 ---
const COLLAPSE_THRESHOLD = 3;

/**
 * 공유 기록 목록 컴포넌트
 * 모임에 공유된 기록을 책별로 그룹화하여 표시
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
      {/* 상단 안내 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("groups.sharedNotesCount").replace(
            "{count}",
            String(notes.length)
          )}
        </p>
      </div>

      {/* 책별 그룹 목록 */}
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
                {/* 책 표지 (작게) */}
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

                {/* 책 정보 */}
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
                      {group.book.author}
                    </p>
                  )}
                </div>

                {/* 기록 수 배지 */}
                <Badge variant="secondary" className="shrink-0 text-xs">
                  <MessageSquare className="mr-1 h-3 w-3" />
                  {t("groups.bookGroupCount").replace(
                    "{count}",
                    String(group.notes.length)
                  )}
                </Badge>
              </div>

              {/* 기록 아이템 목록 */}
              <div className="divide-y">
                {visibleNotes.map((item) => (
                  <SharedNoteItem
                    key={item.id}
                    item={item}
                    groupId={groupId}
                  />
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

// --- 개별 기록 아이템 ---

function SharedNoteItem({
  item,
  groupId,
}: {
  item: SharedNotesListProps["notes"][number];
  groupId?: string;
}) {
  const { t } = useTranslation();
  const note = item.notes;
  const user = note.users;
  const styleType = (note.type in NOTE_TYPE_STYLES
    ? note.type
    : "memo") as NoteStyleType;
  const config = NOTE_TYPE_STYLES[styleType];
  const TypeIcon = config.icon;

  return (
    <Link href={`/notes/${note.id}`} className="block">
      <div className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
        {/* 타입 아이콘 + 콘텐츠 */}
        <div className="flex gap-2.5">
          {/* 타입 아이콘 */}
          <div
            className={`mt-0.5 p-1.5 rounded-full shrink-0 h-fit ${config.bgColor}`}
          >
            <TypeIcon className={`h-3.5 w-3.5 ${config.color}`} />
          </div>

          {/* 콘텐츠 영역 */}
          <div className="flex-1 min-w-0">
            {/* 기록 내용 (타입별 스타일) */}
            <div className={config.wrapperClass}>
              {note.image_url && isValidImageUrl(note.image_url) && (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted mb-2 float-right ml-2">
                  <Image
                    src={getImageUrl(note.image_url)}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
              <NoteContentViewer
                content={note.content}
                pageNumber={parsePageNumber(note.page_number)}
                maxLength={120}
                compact
              />
            </div>

            {/* 푸터: 작성자 + 페이지 + 날짜 */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              {user && (
                <>
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {user.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[80px]">{user.name}</span>
                </>
              )}
              {note.page_number && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span>p.{note.page_number}</span>
                </>
              )}
              <span className="text-muted-foreground/40">·</span>
              <span className="shrink-0" suppressHydrationWarning>
                {formatSmartDate(item.shared_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
