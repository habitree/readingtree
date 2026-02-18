"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Quote, Camera, FileText, ScanText, Share2 } from "lucide-react";
import { getShareableNotes, shareNotesToGroup } from "@/app/actions/groups";
import { toast } from "sonner";
import { formatSmartDate } from "@/lib/utils/date";
import type { NoteType } from "@/types/group";

interface ShareNoteDialogProps {
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
  transcription: "사진 필사",
};

export function ShareNoteDialog({
  open,
  onOpenChange,
  groupId,
  bookId,
  bookTitle,
  onSuccess,
}: ShareNoteDialogProps) {
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
      toast.error("기록을 불러오지 못했어요.");
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
      toast.success(`${result.sharedCount}개의 기록이 공유됐어요.`);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            기록 공유하기
          </DialogTitle>
          <DialogDescription>
            &quot;{bookTitle}&quot;에 대한 내 기록을 모임에 공유합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                공유할 수 있는 기록이 없습니다.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                이 책에 대한 기록을 먼저 작성해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b">
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

              {notes.map((note) => {
                const Icon = noteTypeIcons[note.type as NoteType];
                return (
                  <label
                    key={note.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedNoteIds.has(note.id)
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedNoteIds.has(note.id)}
                      onCheckedChange={() => toggleNote(note.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
          )}
        </div>

        <DialogFooter>
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
                공유 중...
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                {selectedNoteIds.size}개 공유
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
