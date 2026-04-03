"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookshelfSelector } from "@/components/bookshelves/bookshelf-selector";
import { addAllGroupBooksToMyLibrary } from "@/app/actions/groups";
import { toast } from "sonner";
import { Loader2, Library, FolderPlus, Home } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { ReadingStatus } from "@/types/book";
import { cn } from "@/lib/utils";

type ShelfMode = "new" | "existing" | "main";

interface BatchAddBooksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  totalBooks: number;
  booksNotInLibrary: number;
  onComplete: () => void;
}

export function BatchAddBooksDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  totalBooks,
  booksNotInLibrary,
  onComplete,
}: BatchAddBooksDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ShelfMode>("new");
  const [newShelfName, setNewShelfName] = useState(`${groupName} 서재`);
  const [selectedBookshelfId, setSelectedBookshelfId] = useState<string>("");
  const [status, setStatus] = useState<ReadingStatus>("reading");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const options: Parameters<typeof addAllGroupBooksToMyLibrary>[1] = {
        status,
      };

      if (mode === "new") {
        options.createNewBookshelf = true;
        options.bookshelfName = newShelfName.trim() || `${groupName} 서재`;
      } else if (mode === "existing") {
        if (!selectedBookshelfId) {
          toast.error("서재를 선택해주세요.");
          return;
        }
        options.bookshelfId = selectedBookshelfId;
      }
      // mode === "main" → 아무 옵션 없이 메인 서재 fallback

      const result = await addAllGroupBooksToMyLibrary(groupId, options);

      if (result.added === 0) {
        toast.info(t("groups.batchAddAlreadyAll"));
      } else {
        const msg = t("groups.batchAddSuccess")
          .replace("{count}", String(result.added))
          .replace("{shelf}", result.bookshelfName);
        const skipMsg =
          result.skipped > 0
            ? " " +
              t("groups.batchAddSkipped").replace(
                "{count}",
                String(result.skipped)
              )
            : "";
        toast.success(msg + skipMsg);
      }

      onOpenChange(false);
      onComplete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "일괄 등록에 실패했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const skippedCount = totalBooks - booksNotInLibrary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("groups.batchAddTitle")}</DialogTitle>
          <DialogDescription>
            {t("groups.batchAddDescription")
              .replace("{total}", String(totalBooks))
              .replace("{count}", String(booksNotInLibrary))}
            {skippedCount > 0 &&
              ` ${t("groups.batchAddSkipped").replace("{count}", String(skippedCount))}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 서재 선택 */}
          <div className="space-y-3">
            <Label>등록할 서재</Label>

            <div className="space-y-2">
              <ModeButton
                active={mode === "new"}
                onClick={() => setMode("new")}
                icon={<FolderPlus className="h-4 w-4" />}
                label={t("groups.newBookshelf")}
              />
              {mode === "new" && (
                <div className="pl-8">
                  <Input
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    placeholder={`${groupName} 서재`}
                  />
                </div>
              )}

              <ModeButton
                active={mode === "existing"}
                onClick={() => setMode("existing")}
                icon={<Library className="h-4 w-4" />}
                label={t("groups.existingBookshelf")}
              />
              {mode === "existing" && (
                <div className="pl-8">
                  <BookshelfSelector
                    value={selectedBookshelfId}
                    onValueChange={setSelectedBookshelfId}
                  />
                </div>
              )}

              <ModeButton
                active={mode === "main"}
                onClick={() => setMode("main")}
                icon={<Home className="h-4 w-4" />}
                label={t("groups.mainBookshelf")}
              />
            </div>
          </div>

          {/* 읽기 상태 선택 */}
          <div className="space-y-2">
            <Label>{t("groups.selectReadingStatus")}</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ReadingStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">
                  {t("books.statusNotStarted")}
                </SelectItem>
                <SelectItem value="reading">
                  {t("books.statusReading")}
                </SelectItem>
                <SelectItem value="completed">
                  {t("books.statusCompleted")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || booksNotInLibrary === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("groups.batchAddButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors text-left",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
          active ? "border-primary" : "border-muted-foreground/40"
        )}
      >
        {active && (
          <div className="h-2 w-2 rounded-full bg-primary" />
        )}
      </div>
      {icon}
      <span>{label}</span>
    </button>
  );
}
