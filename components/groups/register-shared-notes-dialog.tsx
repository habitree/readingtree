"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Quote,
  Camera,
  FileText,
  ScanText,
  Share2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  StickyNote,
  Check,
} from "lucide-react";
import {
  getShareableNotesForAllBooks,
  shareNotesToGroup,
} from "@/app/actions/groups";
import { toast } from "sonner";
import { formatSmartDate } from "@/lib/utils/date";
import { parseNoteContentFields } from "@/lib/utils/note";
import { formatAuthor } from "@/lib/utils/book";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";

interface RegisterSharedNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onSuccess?: () => void;
}

interface BookWithNotes {
  bookId: string;
  book: {
    id: string;
    title: string;
    author: string | null;
    cover_image_url: string | null;
  };
  notes: Array<{
    id: string;
    book_id: string;
    title: string | null;
    type: string;
    content: string | null;
    image_url: string | null;
    page_number: number | null;
    tags: string[] | null;
    created_at: string;
  }>;
}

const noteTypeIcons: Record<string, typeof FileText> = {
  quote: Quote,
  photo: Camera,
  memo: StickyNote,
  transcription: ScanText,
};

const noteTypeLabels: Record<string, string> = {
  quote: "인용구",
  memo: "메모",
  photo: "사진",
  transcription: "필사",
};

export function RegisterSharedNotesDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: RegisterSharedNotesDialogProps) {
  const { t } = useTranslation();
  const [booksWithNotes, setBooksWithNotes] = useState<BookWithNotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getShareableNotesForAllBooks(groupId);
      setBooksWithNotes(data);
      // 기록이 있는 첫 번째 책을 자동으로 펼침
      const firstWithNotes = data.find((b) => b.notes.length > 0);
      if (firstWithNotes) {
        setExpandedBooks(new Set([firstWithNotes.bookId]));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "기록을 불러오지 못했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (open) {
      loadData();
      setSelectedNoteIds(new Set());
      setExpandedBooks(new Set());
    }
  }, [open, loadData]);

  const toggleBook = (bookId: string) => {
    setExpandedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  const toggleNote = (noteId: string) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  };

  const toggleBookNotes = (bookNotes: BookWithNotes["notes"]) => {
    const noteIds = bookNotes.map((n) => n.id);
    const allSelected = noteIds.every((id) => selectedNoteIds.has(id));
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        noteIds.forEach((id) => next.delete(id));
      } else {
        noteIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleAll = () => {
    const allNoteIds = booksWithNotes.flatMap((b) => b.notes.map((n) => n.id));
    if (selectedNoteIds.size === allNoteIds.length && allNoteIds.length > 0) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(allNoteIds));
    }
  };

  const handleShare = async () => {
    if (selectedNoteIds.size === 0) return;

    try {
      setIsSharing(true);
      const result = await shareNotesToGroup(
        Array.from(selectedNoteIds),
        groupId
      );
      toast.success(
        t("groups.registerSuccess").replace(
          "{count}",
          String(result.sharedCount)
        )
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "공유에 실패했습니다."
      );
    } finally {
      setIsSharing(false);
    }
  };

  const totalShareable = booksWithNotes.reduce(
    (sum, b) => sum + b.notes.length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t("groups.registerSharedNotesTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("groups.registerSharedNotesDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : booksWithNotes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {t("groups.noDesignatedBooks")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("groups.noDesignatedBooksDesc")}
              </p>
            </div>
          ) : totalShareable === 0 ? (
            <div className="text-center py-12">
              <Check className="h-10 w-10 text-emerald-500/60 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {t("groups.allShared")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                모든 기록이 이미 공유되었어요.
              </p>
            </div>
          ) : (
            <>
              {/* 전체 선택 헤더 */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={
                      selectedNoteIds.size === totalShareable &&
                      totalShareable > 0
                    }
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">
                    {t("groups.selectAll")}
                  </span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {t("groups.selectedCount")
                    .replace("{selected}", String(selectedNoteIds.size))
                    .replace("{total}", String(totalShareable))}
                </span>
              </div>

              {/* 책별 기록 목록 */}
              <div className="flex-1 overflow-y-auto max-h-[calc(85vh-220px)] -mr-2 pr-2 space-y-1">
                  {booksWithNotes.map((bookGroup) => {
                    const isExpanded = expandedBooks.has(bookGroup.bookId);
                    const hasNotes = bookGroup.notes.length > 0;
                    const bookNoteIds = bookGroup.notes.map((n) => n.id);
                    const allBookSelected =
                      hasNotes &&
                      bookNoteIds.every((id) => selectedNoteIds.has(id));
                    const someBookSelected =
                      hasNotes &&
                      bookNoteIds.some((id) => selectedNoteIds.has(id));

                    return (
                      <div
                        key={bookGroup.bookId}
                        className="rounded-lg border overflow-hidden"
                      >
                        {/* 책 헤더 */}
                        <button
                          type="button"
                          onClick={() =>
                            hasNotes && toggleBook(bookGroup.bookId)
                          }
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                            hasNotes
                              ? "hover:bg-muted/50 cursor-pointer"
                              : "opacity-60 cursor-default"
                          }`}
                        >
                          {/* 책 표지 */}
                          <div className="relative w-8 h-11 rounded-md overflow-hidden bg-muted shrink-0">
                            {bookGroup.book.cover_image_url &&
                            isValidImageUrl(bookGroup.book.cover_image_url) ? (
                              <Image
                                src={getImageUrl(
                                  bookGroup.book.cover_image_url
                                )}
                                alt={bookGroup.book.title}
                                fill
                                className="object-cover"
                                sizes="32px"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <BookOpen className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {bookGroup.book.title}
                            </p>
                            {bookGroup.book.author && (
                              <p className="text-xs text-muted-foreground truncate">
                                {formatAuthor(bookGroup.book.author)}
                              </p>
                            )}
                          </div>

                          {hasNotes ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                {t("groups.shareableCount").replace(
                                  "{count}",
                                  String(bookGroup.notes.length)
                                )}
                              </Badge>
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              {t("groups.noMyNotes")}
                            </Badge>
                          )}
                        </button>

                        {/* 기록 목록 (펼쳐진 상태) */}
                        {isExpanded && hasNotes && (
                          <div className="border-t bg-muted/20">
                            {/* 책 전체 선택 */}
                            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40">
                              <Checkbox
                                checked={allBookSelected}
                                ref={(el) => {
                                  if (el) {
                                    const input = el as unknown as HTMLButtonElement;
                                    input.dataset.indeterminate = String(
                                      someBookSelected && !allBookSelected
                                    );
                                  }
                                }}
                                onCheckedChange={() =>
                                  toggleBookNotes(bookGroup.notes)
                                }
                              />
                              <span className="text-xs text-muted-foreground">
                                이 책 전체 선택 ({bookGroup.notes.length}개)
                              </span>
                            </div>

                            {/* 기록 항목들 */}
                            <div className="divide-y divide-border/30">
                              {bookGroup.notes.map((note) => {
                                const Icon =
                                  noteTypeIcons[note.type] || FileText;
                                const typeLabel =
                                  noteTypeLabels[note.type] || "기록";
                                const { quote, memo } =
                                  parseNoteContentFields(note.content);
                                const displayText =
                                  quote || memo || "";
                                const trimmed =
                                  displayText.length > 80
                                    ? displayText.substring(0, 77) + "..."
                                    : displayText;

                                return (
                                  <label
                                    key={note.id}
                                    className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                                      selectedNoteIds.has(note.id)
                                        ? "bg-primary/5"
                                        : "hover:bg-muted/30"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={selectedNoteIds.has(note.id)}
                                      onCheckedChange={() =>
                                        toggleNote(note.id)
                                      }
                                      className="mt-0.5"
                                    />

                                    {/* 이미지 썸네일 */}
                                    {note.image_url &&
                                      isValidImageUrl(note.image_url) && (
                                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                                          <Image
                                            src={getImageUrl(note.image_url)}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            sizes="40px"
                                          />
                                        </div>
                                      )}

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <span className="text-[11px] font-medium text-muted-foreground">
                                          {typeLabel}
                                        </span>
                                        {note.page_number && (
                                          <span className="text-[11px] text-muted-foreground/60">
                                            p.{note.page_number}
                                          </span>
                                        )}
                                        <span
                                          className="text-[10px] text-muted-foreground/50 ml-auto shrink-0"
                                          suppressHydrationWarning
                                        >
                                          {formatSmartDate(note.created_at)}
                                        </span>
                                      </div>
                                      {trimmed && (
                                        <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
                                          {trimmed}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </div>

        {totalShareable > 0 && (
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              onClick={handleShare}
              disabled={isSharing || selectedNoteIds.size === 0}
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("groups.registering")}
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  {t("groups.registerSelected").replace(
                    "{count}",
                    String(selectedNoteIds.size)
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
