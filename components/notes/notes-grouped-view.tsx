"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { NoteCard } from "@/components/notes/note-card";
import { getImageUrl } from "@/lib/utils/image";
import type { NoteWithBook } from "@/types/note";
import { READTREE_BOOK_ID } from "@/lib/constants/readtree";

interface NotesGroupedViewProps {
  notes: NoteWithBook[];
}

interface BookGroup {
  bookId: string | null;
  bookTitle: string;
  bookAuthor: string | null;
  coverUrl: string | null;
  notes: NoteWithBook[];
}

/**
 * 책별 그룹 뷰
 * 기록을 book_id별로 그룹화하여 표시
 * "메모(책 없음)" 그룹은 하단에
 */
export function NotesGroupedView({ notes }: NotesGroupedViewProps) {
  const groups = useMemo(() => {
    const map = new Map<string, BookGroup>();

    for (const note of notes) {
      const key = note.book_id ?? "no-book";
      const isFreeMemo = note.book_id === READTREE_BOOK_ID || !note.book_id;

      if (!map.has(key)) {
        map.set(key, {
          bookId: isFreeMemo ? null : note.book_id,
          bookTitle: isFreeMemo ? "메모" : (note.book?.title ?? "알 수 없는 책"),
          bookAuthor: isFreeMemo ? null : (note.book?.author ?? null),
          coverUrl: isFreeMemo ? null : (note.book?.cover_image_url ?? null),
          notes: [],
        });
      }
      map.get(key)!.notes.push(note);
    }

    // 책 그룹을 먼저, 메모 그룹을 마지막에
    const bookGroups: BookGroup[] = [];
    let memoGroup: BookGroup | null = null;

    for (const group of map.values()) {
      if (group.bookId === null) {
        memoGroup = group;
      } else {
        bookGroups.push(group);
      }
    }

    // 최신 기록이 있는 책 순으로 정렬
    bookGroups.sort((a, b) => {
      const aDate = a.notes[0]?.created_at ?? "";
      const bDate = b.notes[0]?.created_at ?? "";
      return bDate.localeCompare(aDate);
    });

    if (memoGroup) bookGroups.push(memoGroup);
    return bookGroups;
  }, [notes]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.bookId ?? "memo"}>
          {/* 그룹 헤더 */}
          <div className="flex items-center gap-3 mb-3">
            {group.bookId ? (
              <Link
                href={`/books/${group.bookId}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                {group.coverUrl ? (
                  <Image
                    src={getImageUrl(group.coverUrl)}
                    alt={group.bookTitle}
                    width={32}
                    height={44}
                    className="rounded object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-11 rounded bg-muted flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold line-clamp-1">{group.bookTitle}</p>
                  {group.bookAuthor && (
                    <p className="text-[11px] text-muted-foreground">{group.bookAuthor}</p>
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {group.bookTitle}
                </p>
              </div>
            )}
            <span className="text-[11px] text-muted-foreground ml-auto">
              {group.notes.length}개
            </span>
          </div>

          {/* 기록 카드 목록 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {group.notes.map((note) => (
              <NoteCard key={note.id} note={note} showDeleteButton />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
