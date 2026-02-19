"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { deleteBook } from "@/app/actions/books";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface BookDeleteButtonProps {
  userBookId: string;
  bookTitle: string;
  variant?: "default" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * 책 삭제 버튼 컴포넌트
 * 제목 입력 확인 후 책을 삭제합니다
 */
export function BookDeleteButton({ userBookId, bookTitle, variant = "default", size }: BookDeleteButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");

  const handleDelete = async () => {
    // 제목이 정확히 일치하는지 확인
    if (confirmTitle.trim() !== bookTitle.trim()) {
      toast.error(t("books.titleMismatchError"));
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBook(userBookId);
      toast.success(t("books.bookDeletedSuccess"));
      setIsOpen(false);
      setConfirmTitle("");
      router.push("/books");
    } catch (error) {
      console.error("책 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("books.bookDeleteFailed")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setConfirmTitle("");
    }
  };

  const buttonSize = size || (variant === "icon" ? "icon" : "default");

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size={buttonSize}
          disabled={isDeleting}
          className={variant === "icon" ? "h-3 w-3 sm:h-4 sm:w-4 p-0 shadow-sm sm:shadow-md hover:shadow-lg" : ""}
        >
          {isDeleting ? (
            <>
              <Loader2 className={variant === "icon" ? "h-2 w-2" : "mr-2 h-4 w-4 animate-spin"} />
              {variant !== "icon" && t("books.deletingBook")}
            </>
          ) : (
            <>
              <Trash2 className={variant === "icon" ? "h-2 w-2" : "mr-2 h-4 w-4"} />
              {variant !== "icon" && t("books.deleteBook")}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("books.deleteBookConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              {t("books.deleteBookConfirmMessage")}
              <br />
              {t("books.deleteBookConfirmDetail")}
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-title" className="text-sm font-medium">
                {t("books.deleteConfirmInputLabel")}
              </Label>
              <p className="text-sm font-semibold text-foreground bg-muted p-2 rounded">
                {bookTitle}
              </p>
              <Input
                id="confirm-title"
                value={confirmTitle}
                onChange={(e) => setConfirmTitle(e.target.value)}
                placeholder={t("books.deleteConfirmPlaceholder")}
                disabled={isDeleting}
                className="mt-2"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t("books.cancelLabel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || confirmTitle.trim() !== bookTitle.trim()}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("books.deletingBook")}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("books.deleteLabel")}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

