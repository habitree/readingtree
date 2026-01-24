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

interface NoteActionsProps {
  noteId: string;
}

/**
 * 기록 액션 메뉴 컴포넌트
 * 수정, 삭제 기능 제공
 */
export function NoteActions({ noteId }: NoteActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("정말 이 기록을 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteNote(noteId);
      toast.success("삭제됨");
      // router.push만 사용 (Next.js App Router가 자동으로 서버 컴포넌트를 다시 렌더링)
      router.push("/notes");
    } catch (error) {
      console.error("기록 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "기록 삭제에 실패했습니다."
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
            수정
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

