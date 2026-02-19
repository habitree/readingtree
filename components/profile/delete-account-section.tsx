"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
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
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== t("deleteAccount.confirmWord")) {
      setDeleteError(t("deleteAccount.confirmError"));
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount(deleteConfirmText);
    } catch (error) {
      console.error("계정 삭제 오류:", error);
      setDeleteError(
        error instanceof Error ? error.message : t("deleteAccount.deleteError")
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
    <Card variant="destructive">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t("deleteAccount.dangerZone")}
        </CardTitle>
        <CardDescription>
          {t("deleteAccount.dangerZoneDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              {t("deleteAccount.deleteAccount")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t("deleteAccount.deleteAccountTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="font-medium text-destructive">
                    {t("deleteAccount.irreversible")}
                  </p>
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm space-y-2">
                    <p>{t("deleteAccount.deleteWarning")}</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>{t("deleteAccount.profileInfo")}</li>
                      <li>{t("deleteAccount.readingNotes")}</li>
                      <li>{t("deleteAccount.bookInfo")}</li>
                      <li>{t("deleteAccount.reviewsAndComments")}</li>
                    </ul>
                    <p className="font-semibold text-destructive">
                      {t("deleteAccount.cannotRecover")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm" className="text-sm">
                      {t("deleteAccount.confirmLabel")}{" "}
                      <span className="font-bold">{t("deleteAccount.confirmWord")}</span>{t("deleteAccount.confirmLabelSuffix")}
                    </Label>
                    <Input
                      id="delete-confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={t("deleteAccount.confirmPlaceholder")}
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
              <AlertDialogCancel disabled={isDeleting}>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== t("deleteAccount.confirmWord") || isDeleting}
                variant="destructive"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("deleteAccount.deleting")}
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("deleteAccount.deleteAccount")}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
