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
import { useTranslation } from "@/lib/i18n";

interface ShareNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  bookId: string;
  bookTitle: string;
  onSuccess?: () => void;
}

const noteTypeIcons: Record<string, typeof Quote> = {
  quote: Quote,
  photo: Camera,
  memo: FileText,
  transcription: ScanText,
};

const noteTypeLabelKeys: Record<string, string> = {
  quote: "groups.noteTypeQuote",
  photo: "groups.noteTypePhoto",
  memo: "groups.noteTypeMemo",
  transcription: "groups.noteTypeTranscription",
};

export function ShareNoteDialog({
  open,
  onOpenChange,
  groupId,
  bookId,
  bookTitle,
  onSuccess,
}: ShareNoteDialogProps) {
  const { t } = useTranslation();
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
      toast.error(t("errors.loadError"));
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
      toast.error(t("groups.selectNotes"));
      return;
    }

    try {
      setIsSharing(true);
      const result = await shareNotesToGroup(
        Array.from(selectedNoteIds),
        groupId
      );
      toast.success(t("groups.notesSharedCount").replace("{count}", String(result.sharedCount)));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.saveError")
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
            {t("groups.shareNoteTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("groups.shareNoteDesc").replace("{bookTitle}", bookTitle)}
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
                {t("groups.noShareableNotes")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("groups.writeNoteFirst")}
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
                  <span className="text-sm font-medium">{t("groups.selectAll")}</span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {t("groups.selectedCount")
                    .replace("{selected}", String(selectedNoteIds.size))
                    .replace("{total}", String(notes.length))}
                </span>
              </div>

              {notes.map((note) => {
                const Icon = noteTypeIcons[note.type] || FileText;
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
                          {t((noteTypeLabelKeys[note.type as NoteType] || "groups.noteTypeMemo") as Parameters<typeof t>[0])}
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
                      <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
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
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || selectedNoteIds.size === 0}
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("groups.sharing")}
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                {t("groups.shareCount").replace("{count}", String(selectedNoteIds.size))}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
