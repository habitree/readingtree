"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatSmartDate } from "@/lib/utils/date";
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import {
  BookOpen,
  Quote,
  Camera,
  FileText,
  ScanText,
  PenLine,
  ArrowRight,
  Sparkles,
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

const noteTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  quote: { icon: Quote, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/30" },
  photo: { icon: Camera, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/30" },
  memo: { icon: FileText, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950/30" },
  transcription: { icon: ScanText, color: "text-purple-600", bgColor: "bg-purple-50 dark:bg-purple-950/30" },
};

/**
 * 공유 기록 목록 컴포넌트
 * 모임에 공유된 기록 표시 (책 정보 + 작성자 포함)
 */
export function SharedNotesList({ notes, groupId }: SharedNotesListProps) {
  const { t } = useTranslation();

  if (notes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
              <PenLine className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-semibold mb-2">{t("groups.noSharedNotesEmpty")}</h4>
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

  // 책별로 기록 그룹핑 (최신 순 유지하면서 책 정보 표시)
  return (
    <div className={spacing.pageSection}>
      {/* 상단 안내 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("groups.sharedNotesCount").replace("{count}", String(notes.length))}
        </p>
      </div>

      {/* 기록 목록 */}
      <div className="space-y-3">
        {notes.map((item, index) => {
          const note = item.notes;
          const book = note.books || note.book;
          const user = note.users;
          const config = noteTypeConfig[note.type] || noteTypeConfig.memo;
          const TypeIcon = config.icon;

          return (
            <Link
              key={item.id}
              href={`/notes/${note.id}`}
              className="block"
            >
              <Card
                className="overflow-hidden hover:shadow-md transition-all hover:border-primary/20 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* 책 표지 이미지 */}
                    <div className="relative w-20 sm:w-24 shrink-0 bg-muted">
                      {book?.cover_image_url && isValidImageUrl(book.cover_image_url) ? (
                        <Image
                          src={getImageUrl(book.cover_image_url)}
                          alt={book?.title || t("books.book")}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      {/* 기록 유형 배지 (표지 위 오버레이) */}
                      <div className="absolute top-1 right-1">
                        <div className={`p-1 rounded-full ${config.bgColor}`}>
                          <TypeIcon className={`h-3 w-3 ${config.color}`} />
                        </div>
                      </div>
                    </div>

                    {/* 기록 내용 */}
                    <div className="flex-1 p-3 sm:p-4 min-w-0">
                      {/* 헤더: 책 정보 */}
                      <div className="mb-2">
                        {book && (
                          <p className="text-sm font-medium truncate">
                            {book.title}
                          </p>
                        )}
                        {book?.author && (
                          <p className="text-xs text-muted-foreground truncate">
                            {book.author}
                          </p>
                        )}
                      </div>

                      {/* 기록 내용 미리보기 */}
                      <div className={`mb-2 ${note.type === "quote" ? "border-l-2 border-amber-400 pl-3 italic" : ""}`}>
                        <NoteContentViewer
                          content={note.content}
                          pageNumber={parsePageNumber(note.page_number)}
                          maxLength={80}
                        />
                      </div>

                      {/* 푸터: 작성자 + 날짜 */}
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          {user && (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={user.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px]">
                                  {user.name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">{user.name}</span>
                              <span className="text-muted-foreground/50">•</span>
                            </>
                          )}
                          <span>{formatSmartDate(item.shared_at)}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

