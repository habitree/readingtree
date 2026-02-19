"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { deleteNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface NoteDeleteButtonProps {
  noteId: string;
}

/**
 * 기록 삭제 버튼 컴포넌트
 * 확인 후 기록을 삭제합니다
 */
export function NoteDeleteButton({ noteId }: NoteDeleteButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteNote(noteId);
      toast.success(t("notes.deleted"));
      setIsOpen(false);
      router.push("/notes");
    } catch (error) {
      console.error("기록 삭제 오류:", error);
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
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
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
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("notes.deleteAction")}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

