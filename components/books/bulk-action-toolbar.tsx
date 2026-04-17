"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, Loader2, PauseCircle, Trash2, X } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { notify } from "@/lib/toast";
import {
  bulkUpdateBookStatus,
  bulkDeleteBooks,
} from "@/app/actions/books";
import type { ReadingStatus } from "@/types/book";

export interface BulkActionToolbarProps {
  selectedIds: string[];
  onClear: () => void;
  onApplied?: () => void;
  className?: string;
}

const STATUS_OPTIONS: { value: ReadingStatus; label: string; icon: typeof BookOpen }[] = [
  { value: "not_started", label: "읽을 예정", icon: BookOpen },
  { value: "reading", label: "읽는 중", icon: BookOpen },
  { value: "paused", label: "잠시 멈춤", icon: PauseCircle },
  { value: "completed", label: "완독", icon: CheckCircle2 },
];

/**
 * 서재·노트 등 다중선택 모드에서 공통으로 사용하는 하단 고정 액션 툴바.
 * useSelectionMode 훅과 함께 사용하도록 설계.
 */
export function BulkActionToolbar({
  selectedIds,
  onClear,
  onApplied,
  className,
}: BulkActionToolbarProps) {
  const [pending, setPending] = useState<"status" | "delete" | null>(null);

  if (selectedIds.length === 0) return null;

  const handleChangeStatus = async (status: ReadingStatus) => {
    setPending("status");
    try {
      const result = await bulkUpdateBookStatus(selectedIds, status);
      if (!result.success) {
        notify.error(result.error ?? "상태 변경에 실패했어요");
        return;
      }
      notify.success(`${result.updated}권의 상태를 변경했어요`, {
        description: result.failed > 0 ? `${result.failed}권은 변경하지 못했어요.` : undefined,
      });
      onClear();
      onApplied?.();
    } finally {
      setPending(null);
    }
  };

  const handleDelete = async () => {
    setPending("delete");
    try {
      const result = await bulkDeleteBooks(selectedIds);
      if (!result.success) {
        notify.error(result.error ?? "삭제에 실패했어요");
        return;
      }
      notify.success(`${result.deleted}권을 서재에서 삭제했어요`);
      onClear();
      onApplied?.();
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg",
        className,
      )}
      role="toolbar"
      aria-label="선택 일괄 작업"
    >
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={onClear}
            aria-label="선택 해제"
          >
            <X className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            <span className="text-primary">{selectedIds.length}</span>권 선택됨
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={pending !== null}
              >
                {pending === "status" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                상태 변경
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUS_OPTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => handleChangeStatus(value)}
                  disabled={pending !== null}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={pending !== null}
              >
                {pending === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  선택한 {selectedIds.length}권을 삭제할까요?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  삭제한 책은 서재에서 즉시 사라지며, 관련 기록도 더 이상 책과 연결되지 않아요. 이 작업은 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
