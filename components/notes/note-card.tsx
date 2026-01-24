"use client";

import { useState } from "react";
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
import { FileText, Image as ImageIcon, PenTool, Camera, Trash2, Loader2 } from "lucide-react";
import { BookLinkRenderer } from "./book-link-renderer";

interface NoteCardProps {
  note: NoteWithBook;
  showDeleteButton?: boolean;
  onDelete?: () => void;
}

/**
 * 기록 카드 컴포넌트
 */
export function NoteCard({ note, showDeleteButton = false, onDelete }: NoteCardProps) {
  const typeIcons = {
    quote: FileText,
    transcription: PenTool,
    photo: Camera,
    memo: ImageIcon,
  };

  const hasImage = !!note.image_url;
  const typeLabel = getNoteTypeLabel(note.type, hasImage);
  const Icon = typeIcons[note.type];

  // OCR 상태 확인: transcription 타입이고 이미지가 있는 경우 실제 상태 확인
  const { status: ocrStatus } = useOCRStatus({
    noteId: note.id,
    enabled: note.type === "transcription" && hasImage,
    pollInterval: 3000,
  });

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    }
  };

  const cardContent = (
    <Link
      href={`/notes/${note.id}`}
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
      <Card className="hover:shadow-lg active:shadow-md active:scale-[0.99] transition-all cursor-pointer h-full relative group">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-3 sm:gap-4">
            {/* 이미지 또는 책 표지 */}
            {note.image_url ? (
              <div className="relative w-16 h-22 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
                <Image
                  src={getImageUrl(note.image_url)}
                  alt={note.type}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 64px, 80px"
                />
              </div>
            ) : note.book?.cover_image_url ? (
              <div className="relative w-16 h-22 sm:w-20 sm:h-28 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
                <Image
                  src={getImageUrl(note.book.cover_image_url)}
                  alt={note.book.title || "Book cover"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 64px, 80px"
                />
              </div>
            ) : (
              <div className="w-16 h-22 sm:w-20 sm:h-28 shrink-0 flex items-center justify-center rounded-lg bg-muted">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
              </div>
            )}

            {/* 내용 */}
            <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
              {/* 상단: 타입 배지 + 제목 */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px] sm:text-xs h-5 sm:h-6 px-1.5 sm:px-2">
                  {typeLabel}
                </Badge>
                {note.title && (
                  <h3 className="text-xs sm:text-sm font-semibold line-clamp-1 flex-1 min-w-0">
                    <BookLinkRenderer text={note.title} />
                  </h3>
                )}
                <OCRStatusBadge status={ocrStatus} className="shrink-0" />
              </div>

              {/* 내용 미리보기 */}
              <div className="text-xs sm:text-sm">
                <NoteContentViewer
                  content={note.content}
                  pageNumber={parsePageNumber(note.page_number)}
                  maxLength={80}
                />
              </div>

              {/* 책 제목 */}
              {note.book && (
                <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                  {note.book.title}
                </p>
              )}

              {/* 하단: 태그 + 날짜 */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                {note.tags && note.tags.length > 0 ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                    {note.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-[10px] h-4 px-1.5 shrink-0">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        +{note.tags.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex-1" />
                )}
                <p className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                  {formatSmartDate(note.created_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        {/* 삭제 버튼 - 모바일에서도 보임 (반투명) */}
        {showDeleteButton && (
          <div
            data-delete-button
            className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20"
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { deleteNote } = await import("@/app/actions/notes");
      await deleteNote(noteId);
      const { toast } = await import("sonner");
      toast.success("삭제됨");
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
        error instanceof Error ? error.message : "기록 삭제에 실패했습니다."
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
          <AlertDialogTitle>기록 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription>
            정말로 이 기록을 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              "삭제"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
