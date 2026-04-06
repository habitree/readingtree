"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleShareDialog } from "@/components/share/simple-share-dialog";
import { NoteDeleteButton } from "@/components/notes/note-delete-button";
import { RelatedBooksManager } from "@/components/notes/related-books-manager";
import { OCRStatusChecker } from "@/components/notes/ocr-status-checker";
import { Edit, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { NoteWithBook } from "@/types/note";

interface NoteDetailNavBarProps {
  note: NoteWithBook & { user_book_id?: string | null };
  backUrl: string;
  isGuest: boolean;
  /** 서버에서 이미 로드된 OCR 상태 */
  initialOcrStatus?: "processing" | "completed" | "failed" | null;
  /** 같은 책의 이전 기록 ID */
  prevNoteId?: string | null;
  /** 같은 책의 다음 기록 ID */
  nextNoteId?: string | null;
}

export function NoteDetailNavBar({ note, backUrl, isGuest, initialOcrStatus, prevNoteId, nextNoteId }: NoteDetailNavBarProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-10 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 sm:py-3 bg-background/80 backdrop-blur-lg border-b border-transparent sm:relative sm:border-none sm:bg-transparent sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-2">
        {/* 뒤로가기 버튼 */}
        <Button variant="ghost" size="sm" asChild className="group h-9 px-2 sm:px-3 -ml-2">
          <Link href={backUrl}>
            <ChevronLeft className="h-4 w-4 mr-0.5 sm:mr-1 transition-transform group-hover:-translate-x-1" />
            <BookOpen className="h-4 w-4 mr-1 hidden sm:inline" />
            <span className="text-sm font-medium">{t("notes.backToBook")}</span>
          </Link>
        </Button>

        {/* 이전/다음 기록 네비게이션 + 상태 배지 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {(prevNoteId || nextNoteId) && (
            <div className="flex items-center gap-0.5 mr-1">
              {prevNoteId ? (
                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                  <Link href={`/notes/${prevNoteId}`}><ChevronLeft className="h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {nextNoteId ? (
                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                  <Link href={`/notes/${nextNoteId}`}><ChevronRight className="h-4 w-4" /></Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" disabled className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          <Badge
            variant={note.is_public ? "default" : "secondary"}
            className={`gap-1 py-1 px-2.5 text-xs h-7 ${
              note.is_public
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            {note.is_public ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t("notes.notePublicBadge")}</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t("notes.notePrivateBadge")}</span>
              </>
            )}
          </Badge>
          <OCRStatusChecker
            noteId={note.id}
            noteType={note.type}
            hasImage={!!note.image_url}
            initialOcrStatus={initialOcrStatus}
          />
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide sm:justify-end">
        <SimpleShareDialog note={note} />
        {!isGuest && (
          <>
            <RelatedBooksManager
              noteId={note.id}
              currentRelatedBookIds={note.related_user_book_ids || null}
              mainBookId={note.user_book_id || ""}
            />
            <Button variant="outline" size="sm" asChild className="gap-1.5 h-9 px-3 shrink-0 shadow-sm">
              <Link href={`/notes/${note.id}/edit`}>
                <Edit className="h-4 w-4" />
                <span className="text-sm">{t("notes.noteEditButton")}</span>
              </Link>
            </Button>
            <NoteDeleteButton noteId={note.id} />
          </>
        )}
      </div>
    </div>
  );
}
