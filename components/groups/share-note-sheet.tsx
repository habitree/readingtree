"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Quote,
  Camera,
  FileText,
  ScanText,
  Share2,
  PenLine,
} from "lucide-react";
import { getShareableNotes, shareNotesToGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { formatSmartDate } from "@/lib/utils/date";
import { useRouter } from "next/navigation";
import type { NoteType } from "@/types/group";

interface ShareNoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  bookId: string;
  bookTitle: string;
  onSuccess?: () => void;
}

const noteTypeIcons = {
  quote: Quote,
  photo: Camera,
  memo: FileText,
  transcription: ScanText,
};

const noteTypeLabels = {
  quote: "인용구",
  photo: "사진",
  memo: "메모",
  transcription: "필사",
};

export function ShareNoteSheet({
  open,
  onOpenChange,
  groupId,
  bookId,
  bookTitle,
  onSuccess,
}: ShareNoteSheetProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());

  const loadNotes = async () => {
    try {
      setIsLoading(true);
      const data = await getShareableNotes(groupId, bookId);
      setNotes(data);
    } catch (error) {
      console.error("기록 조회 오류:", error);
      toast.error("기록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadNotes();
      setSelectedNoteIds(new Set());
    }
  }, [open, groupId, bookId]);

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

  const toggleAll = () => {
    if (selectedNoteIds.size === notes.length) {
      setSelectedNoteIds(new Set());
    } else {
      setSelectedNoteIds(new Set(notes.map((n) => n.id)));
    }
  };

  const handleShare = async () => {
    if (selectedNoteIds.size === 0) {
      toast.error("공유할 기록을 선택해주세요.");
      return;
    }

    try {
      setIsSharing(true);
      const result = await shareNotesToGroup(
        Array.from(selectedNoteIds),
        groupId
      );
      toast.success(`${result.sharedCount}개의 기록이 공유되었습니다.`);
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

  const handleWriteNote = () => {
    onOpenChange(false);
    router.push(`/notes/new?bookId=${bookId}&groupId=${groupId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            기록 공유하기
          </SheetTitle>
          <SheetDescription className="line-clamp-1">
            &quot;{bookTitle}&quot;에 대한 내 기록을 모임에 공유합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-8rem)]">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <PenLine className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">
                공유할 수 있는 기록이 없습니다.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                이 책에 대한 기록을 먼저 작성해주세요.
              </p>
              <Button onClick={handleWriteNote}>
                <PenLine className="mr-2 h-4 w-4" />
                기록 작성하기
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-3 border-b">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedNoteIds.size === notes.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">전체 선택</span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {selectedNoteIds.size}/{notes.length}개 선택
                </span>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-2 py-3">
                  {notes.map((note) => {
                    const Icon = noteTypeIcons[note.type as NoteType];
                    return (
                      <label
                        key={note.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                          selectedNoteIds.has(note.id)
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedNoteIds.has(note.id)}
                          onCheckedChange={() => toggleNote(note.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              <Icon className="mr-1 h-3 w-3" />
                              {noteTypeLabels[note.type as NoteType]}
                            </Badge>
                            {note.page_number && (
                              <span className="text-xs text-muted-foreground">
                                p.{note.page_number}
                              </span>
                            )}
                          </div>
                          {note.title && (
                            <p className="font-medium text-sm truncate">
                              {note.title}
                            </p>
                          )}
                          {note.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {note.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatSmartDate(note.created_at)}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {notes.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
            <Button
              onClick={handleShare}
              disabled={isSharing || selectedNoteIds.size === 0}
              className="w-full h-12 text-base"
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  공유 중...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-5 w-5" />
                  {selectedNoteIds.size > 0
                    ? `${selectedNoteIds.size}개 공유하기`
                    : "공유할 기록 선택"}
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
