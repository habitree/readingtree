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
import { useTranslation } from "@/lib/i18n";

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

const noteTypeLabelKeys: Record<string, string> = {
  quote: "groups.noteTypeQuote",
  photo: "groups.noteTypePhoto",
  memo: "groups.noteTypeMemo",
  transcription: "groups.noteTypeTranscription",
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
            {t("groups.shareNoteTitle")}
          </SheetTitle>
          <SheetDescription className="line-clamp-1">
            {t("groups.shareNoteDesc").replace("{bookTitle}", bookTitle)}
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
                {t("groups.noShareableNotes")}
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {t("groups.writeNoteFirst")}
              </p>
              <Button onClick={handleWriteNote}>
                <PenLine className="mr-2 h-4 w-4" />
                {t("groups.writeNoteBtn")}
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
                  <span className="text-sm font-medium">{t("groups.selectAll")}</span>
                </label>
                <span className="text-sm text-muted-foreground">
                  {t("groups.selectedCount")
                    .replace("{selected}", String(selectedNoteIds.size))
                    .replace("{total}", String(notes.length))}
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
                  {t("groups.sharing")}
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-5 w-5" />
                  {selectedNoteIds.size > 0
                    ? t("groups.shareCount").replace("{count}", String(selectedNoteIds.size))
                    : t("groups.selectNotes")}
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
