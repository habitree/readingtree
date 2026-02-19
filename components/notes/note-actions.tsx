"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

interface NoteActionsProps {
  noteId: string;
}

/**
 * 기록 액션 메뉴 컴포넌트
 * 수정, 삭제 기능 제공
 */
export function NoteActions({ noteId }: NoteActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t("notes.deleteConfirmAlert"))) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteNote(noteId);
      toast.success(t("notes.deleted"));
      // router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isDeleting}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/notes/${noteId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            {t("notes.editAction")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t("notes.deleteAction")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

