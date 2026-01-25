"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccount } from "@/app/actions/auth";

/**
 * 계정 삭제 섹션 컴포넌트
 * 프로필 페이지 하단에 표시되는 위험 영역
 */
export function DeleteAccountSection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "계정삭제") {
      setDeleteError("확인 문구를 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount(deleteConfirmText);
    } catch (error) {
      console.error("계정 삭제 오류:", error);
      setDeleteError(
        error instanceof Error ? error.message : "계정 삭제에 실패했습니다."
      );
      setIsDeleting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
      setDeleteError(null);
    } else {
      setDeleteDialogOpen(true);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          위험 영역
        </CardTitle>
        <CardDescription>
          계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              계정 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                계정 삭제
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="font-medium text-destructive">
                    이 작업은 되돌릴 수 없습니다.
                  </p>
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm space-y-2">
                    <p>계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>프로필 정보</li>
                      <li>독서 기록 및 메모</li>
                      <li>서재에 등록한 책 정보</li>
                      <li>작성한 리뷰 및 댓글</li>
                    </ul>
                    <p className="font-semibold text-destructive">
                      삭제된 데이터는 복구할 수 없습니다.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm" className="text-sm">
                      확인을 위해{" "}
                      <span className="font-bold">계정삭제</span>를 입력하세요
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="계정삭제"
                      className="font-mono"
                      disabled={isDeleting}
                    />
                    {deleteError && (
                      <p className="text-sm text-destructive">{deleteError}</p>
                    )}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "계정삭제" || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "삭제 중..." : "계정 삭제"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
