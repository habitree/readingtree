"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getNoteTypeLabel, parsePageNumber } from "@/lib/utils/note";
import { NoteContentViewer } from "./note-content-viewer";
import { OCRStatusBadge } from "./ocr-status-badge";
import { useOCRStatus } from "@/hooks/use-ocr-status";
import type { NoteWithBook } from "@/types/note";
import { FileText, StickyNote, PenTool, Camera, Trash2, Loader2, BookOpen, TrendingUp, PenLine, Clock } from "lucide-react";
import { BookLinkRenderer } from "./book-link-renderer";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface NoteCardProps {
  note: NoteWithBook;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

/**
 * 기록 카드 컴포넌트
 * 심리적/디자인적/기능적 관점에서 최적화된 레이아웃
 */
export function NoteCard({ note, showDeleteButton = false, onDelete }: NoteCardProps) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const handleImgError = useCallback(() => setImgError(true), []);

  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: StickyNote,
    progress: TrendingUp,
  };

  const isDraft = note.status === "draft";
  const noteHref = isDraft ? `/notes/${note.id}/edit` : `/notes/${note.id}`;

  const hasImage = !!note.image_url;
  const typeLabel = getNoteTypeLabel(note.type, hasImage);
  const Icon = typeIcons[note.type];
  const pageNumber = parsePageNumber(note.page_number);

  // OCR 상태 확인: transcription 타입이고 이미지가 있는 경우
  // initialStatus를 전달하여 이미 completed/failed면 폴링하지 않음
  const { status: ocrStatus } = useOCRStatus({
    noteId: note.id,
    enabled: note.type === "transcription" && hasImage,
    initialStatus: (note as any).transcription?.status ?? null,
    pollInterval: 3000,
  });

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    }
  };

  // progress 타입은 컴팩트 가로 레이아웃으로 표시
  const isProgressType = note.type === "progress";

  // progress 타입용 컴팩트 카드
  if (isProgressType) {
    return (
      <Link href={noteHref} className="block">
        <Card className={cn("hover:shadow-md active:scale-[0.99] transition-shadow cursor-pointer relative group border-teal-200/50 dark:border-teal-800/50 bg-gradient-to-r from-teal-50/50 to-transparent dark:from-teal-950/30", isDraft && "border-dashed border-amber-300/60 dark:border-amber-700/40")}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {/* 아이콘 */}
              <div className="shrink-0 w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {note.status === "draft" && (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-semibold border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700">
                      draft
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                    {t("notes.progressRecord")}
                  </Badge>
                  {pageNumber && (
                    <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                      p.{pageNumber}
                    </span>
                  )}
                </div>
                {note.content && (
                  <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                    <NoteContentViewer content={note.content} pageNumber={null} maxLength={60} compact />
                  </div>
                )}
              </div>

              {/* 날짜 */}
              <time className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                {formatSmartDate(note.created_at)}
              </time>
            </div>
          </CardContent>

          {/* 삭제 버튼 */}
          {showDeleteButton && (
            <div
              data-delete-button
              className="absolute top-2 right-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <NoteDeleteButtonWithCallback noteId={note.id} onDelete={handleDelete} />
            </div>
          )}
        </Card>
      </Link>
    );
  }

  // 기존 카드 레이아웃 (progress 외 타입)
  const cardContent = (
    <Link
      href={noteHref}
      className="block h-full"
      onClick={(e) => {
        // 삭제 버튼 영역 클릭 시 링크 이동 방지
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[role="button"]') || target.closest('[data-delete-button]')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Card className={cn("hover:shadow-lg active:shadow-md active:scale-[0.99] transition-shadow cursor-pointer h-full relative group overflow-hidden", isDraft && "border-dashed border-amber-300/60 dark:border-amber-700/40 bg-amber-50/20 dark:bg-amber-950/10")}>
        <CardContent className="p-0">
          <div className="flex">
            {/* 좌측: 이미지/표지 + 책 정보 통합 영역 */}
            <div className="shrink-0 w-20 sm:w-24 bg-muted/30">
              {/* 이미지 또는 책 표지 */}
              <div className="relative w-full aspect-[3/4] overflow-hidden">
                {note.image_url && !imgError ? (
                  <Image
                    src={getImageUrl(note.image_url)}
                    alt={note.type}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 80px, 96px"
                    onError={handleImgError}
                  />
                ) : note.book?.cover_image_url ? (
                  <Image
                    src={getImageUrl(note.book.cover_image_url)}
                    alt={note.book.title || "책 표지"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 80px, 96px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* 책 정보 또는 출처 - 이미지 아래에 심플하게 */}
              {note.book ? (
                <div
                  className="block p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm border-t hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.location.href = `/books/${note.book!.id}`;
                  }}
                >
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[9px] sm:text-[10px] font-medium text-foreground/80 line-clamp-2 leading-tight">
                      {note.book.title}
                    </span>
                  </div>
                </div>
              ) : (note as any).source_label ? (
                <div className="p-1.5 sm:p-2 bg-background/80 backdrop-blur-sm border-t">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground line-clamp-2 leading-tight">
                      {(note as any).source_label}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* 우측: 내용 영역 */}
            <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col">
              {/* 상단: 타입 + 페이지 + OCR 상태 */}
              <div className="flex items-center gap-1.5 mb-2">
                {note.status === "draft" && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-semibold border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-700">
                    draft
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 px-1.5 font-medium">
                  {typeLabel}
                </Badge>
                {pageNumber && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground">
                    p.{pageNumber}
                  </Badge>
                )}
                <OCRStatusBadge status={ocrStatus} className="shrink-0" />
                {note.reading_duration_seconds != null && note.reading_duration_seconds > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-muted-foreground gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {note.reading_duration_seconds >= 3600
                      ? `${Math.floor(note.reading_duration_seconds / 3600)}h${Math.floor((note.reading_duration_seconds % 3600) / 60)}m`
                      : `${Math.floor(note.reading_duration_seconds / 60)}분`}
                  </Badge>
                )}
              </div>

              {/* 제목 (있는 경우) */}
              {note.title && (
                <h3 className="text-sm sm:text-base font-semibold line-clamp-1 mb-1.5">
                  <BookLinkRenderer text={note.title} />
                </h3>
              )}

              {/* 내용 미리보기 - 핵심 영역 */}
              <div className="flex-1 min-h-0">
                {note.content ? (
                  <NoteContentViewer
                    content={note.content}
                    pageNumber={null}
                    maxLength={100}
                    compact
                  />
                ) : note.type === "transcription" && note.transcription?.extracted_text ? (
                  <div className="pl-2.5 border-l-2 border-amber-400/60">
                    <p className="text-xs sm:text-sm text-foreground/80 line-clamp-3 leading-relaxed">
                      {note.transcription.extracted_text.length > 100
                        ? note.transcription.extracted_text.substring(0, 100) + "..."
                        : note.transcription.extracted_text}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* 하단: 태그 + 날짜 */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/50">
                {note.tags && note.tags.length > 0 ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 bg-muted/50 border-0"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
                {isDraft ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                    <PenLine className="w-3 h-3" />
                    {t("notes.editDraft")}
                  </span>
                ) : (
                  <time className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                    {formatSmartDate(note.created_at)}
                  </time>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        {/* 삭제 버튼 */}
        {showDeleteButton && (
          <div
            data-delete-button
            className="absolute top-2 right-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <NoteDeleteButtonWithCallback noteId={note.id} onDelete={handleDelete} />
          </div>
        )}
      </Card>
    </Link>
  );

  return cardContent;
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
