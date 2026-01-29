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
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");

  const handleDelete = async () => {
    // 제목이 정확히 일치하는지 확인
    if (confirmTitle.trim() !== bookTitle.trim()) {
      toast.error("책 제목이 일치하지 않습니다. 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBook(userBookId);
      toast.success("책이 삭제되었습니다.");
      setIsOpen(false);
      setConfirmTitle("");
      router.push("/books");
    } catch (error) {
      console.error("책 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "책 삭제에 실패했습니다."
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
          className={variant === "icon" ? "h-4 w-4 p-0 shadow-md hover:shadow-lg" : ""}
        >
          {isDeleting ? (
            <>
              <Loader2 className={variant === "icon" ? "h-2 w-2" : "mr-2 h-4 w-4 animate-spin"} />
              {variant !== "icon" && "삭제 중..."}
            </>
          ) : (
            <>
              <Trash2 className={variant === "icon" ? "h-2 w-2" : "mr-2 h-4 w-4"} />
              {variant !== "icon" && "책 삭제"}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>책 삭제 확인</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              정말로 이 책을 삭제하시겠습니까?
              <br />
              이 책의 모든 기록도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-title" className="text-sm font-medium">
                삭제를 확인하려면 책 제목을 정확히 입력하세요:
              </Label>
              <p className="text-sm font-semibold text-foreground bg-muted p-2 rounded">
                {bookTitle}
              </p>
              <Input
                id="confirm-title"
                value={confirmTitle}
                onChange={(e) => setConfirmTitle(e.target.value)}
                placeholder="책 제목 입력"
                disabled={isDeleting}
                className="mt-2"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || confirmTitle.trim() !== bookTitle.trim()}
            variant="destructive"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

