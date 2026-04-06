"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getImageUrl } from "@/lib/utils/image";
import { formatSmartDate } from "@/lib/utils/date";
import { parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "./note-content-viewer";
import type { NoteWithBook } from "@/types/note";
import { FileText, PenTool, Camera, Trash2, Loader2, BookOpen, StickyNote } from "lucide-react";
import { BookLinkRenderer } from "./book-link-renderer";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface NoteCardProps {
  note: NoteWithBook;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

const typeIcons = {
  quote: FileText,
  transcription: PenTool,
  photo: Camera,
  memo: StickyNote,
  progress: BookOpen,
} as const;

/**
 * 기록 카드 컴포넌트
 * 심플하고 인지 부하를 최소화한 레이아웃
 */
export function NoteCard({ note, showDeleteButton = false, onDelete }: NoteCardProps) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const isDraft = note.status === "draft";
  const noteHref = isDraft ? `/notes/${note.id}/edit` : `/notes/${note.id}`;
  const Icon = typeIcons[note.type];
  const pageNumber = parsePageNumber(note.page_number);

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    }
  };

  const isProgressType = note.type === "progress";

  // ─── Progress 카드: 표지 + 책제목 + 페이지·날짜 ───
  if (isProgressType) {
    return (
      <Link href={noteHref} className="block">
        <Card className={cn(
          "hover:shadow-md active:scale-[0.99] transition-shadow cursor-pointer relative group border-border/40",
          isDraft && "border-dashed border-amber-300/40 dark:border-amber-700/30"
        )}>
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* 책 표지 미니 썸네일 */}
              {note.book?.cover_image_url ? (
                <div className="shrink-0 w-9 h-12 rounded overflow-hidden bg-muted">
                  <Image
                    src={getImageUrl(note.book.cover_image_url)}
                    alt={note.book.title || ""}
                    width={36}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="shrink-0 w-9 h-12 rounded bg-muted/60 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}

              {/* 중앙: 책 제목 + 콘텐츠 */}
              <div className="flex-1 min-w-0">
                {note.book?.title && (
                  <p className="text-sm font-medium text-foreground/90 line-clamp-1">
                    {note.book.title}
                  </p>
                )}
                {note.content && (
                  <div className="mt-0.5">
                    <NoteContentViewer content={note.content} pageNumber={null} maxLength={50} compact />
                  </div>
                )}
              </div>

              {/* 우측: 페이지 + 날짜 */}
              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {pageNumber && (
                    <span className="font-medium text-foreground/70">p.{pageNumber}</span>
                  )}
                  {pageNumber && <span className="text-muted-foreground/40">&middot;</span>}
                  <time suppressHydrationWarning>
                    {formatSmartDate(note.created_at)}
                  </time>
                </div>
              </div>
            </div>
          </CardContent>

          {/* 삭제 버튼 */}
          {showDeleteButton && (
            <div
              data-delete-button
              className="absolute top-2 right-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            >
              <NoteDeleteButtonWithCallback noteId={note.id} onDelete={handleDelete} />
            </div>
          )}
        </Card>
      </Link>
    );
  }

  // ─── 일반 카드: 표지 + 아이콘·페이지 + 제목 + 내용 2줄 + 날짜 ───
  return (
    <Link
      href={noteHref}
      className="block h-full"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button") || target.closest('[role="button"]') || target.closest("[data-delete-button]")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Card className={cn(
        "hover:shadow-md active:scale-[0.99] transition-shadow cursor-pointer h-full relative group overflow-hidden border-border/40",
        isDraft && "border-dashed border-amber-300/40 dark:border-amber-700/30"
      )}>
        <CardContent className="p-0">
          <div className="flex">
            {/* 좌측: 표지만 */}
            <div className="shrink-0 w-16 sm:w-20">
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-l-lg">
                {note.image_url && !imgError ? (
                  <Image
                    src={getImageUrl(note.image_url)}
                    alt={note.type}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, 80px"
                    onError={handleImgError}
                  />
                ) : note.book?.cover_image_url ? (
                  <Image
                    src={getImageUrl(note.book.cover_image_url)}
                    alt={note.book.title || ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 64px, 80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/40">
                    <Icon className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 내용 */}
            <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-1.5">
              {/* 상단: 타입 아이콘 + 페이지 + draft 텍스트 */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />
                {pageNumber && (
                  <>
                    <span className="text-muted-foreground/40">&middot;</span>
                    <span>p.{pageNumber}</span>
                  </>
                )}
                {isDraft && (
                  <>
                    <span className="text-muted-foreground/40">&middot;</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">draft</span>
                  </>
                )}
              </div>

              {/* 제목 */}
              {note.title && (
                <h3 className="text-sm font-medium line-clamp-1 text-foreground/90">
                  <BookLinkRenderer text={note.title} />
                </h3>
              )}

              {/* 내용 미리보기 2줄 */}
              <div className="flex-1 min-h-0">
                {note.content ? (
                  <NoteContentViewer
                    content={note.content}
                    pageNumber={null}
                    maxLength={80}
                    compact
                  />
                ) : note.type === "transcription" && note.transcription?.extracted_text ? (
                  <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                    {note.transcription.extracted_text.length > 80
                      ? note.transcription.extracted_text.substring(0, 80) + "..."
                      : note.transcription.extracted_text}
                  </p>
                ) : null}
              </div>

              {/* 하단: 날짜만 */}
              <time className="text-[10px] text-muted-foreground/60 mt-auto" suppressHydrationWarning>
                {formatSmartDate(note.created_at)}
              </time>
            </div>
          </div>
        </CardContent>

        {/* 삭제 버튼 */}
        {showDeleteButton && (
          <div
            data-delete-button
            className="absolute top-2 right-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
          >
            <NoteDeleteButtonWithCallback noteId={note.id} onDelete={handleDelete} />
          </div>
        )}
      </Card>
    </Link>
  );
}

/**
 * 삭제 후 콜백을 지원하는 삭제 버튼 래퍼
 */
function NoteDeleteButtonWithCallback({
  noteId,
  onDelete
}: {
  noteId: string;
  onDelete?: () => void;
}) {
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { deleteNote } = await import("@/app/actions/notes");
      await deleteNote(noteId);
      const { toast } = await import("sonner");
      toast.success(t("notes.deleted"));
      setIsOpen(false);
      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("기록 삭제 오류:", error);
      const { toast } = await import("sonner");
      toast.error(
        error instanceof Error ? error.message : t("notes.deleteError")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting} className="h-7 w-7 p-0">
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("notes.deleteConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("notes.deleteConfirmDesc")}
            <br />
            {t("notes.deleteIrreversible")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("notes.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("notes.deleting")}
              </>
            ) : (
              t("notes.deleteAction")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
