"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
// ScrollArea가 없으면 일반 div 사용

export type OCRItemStatus = "pending" | "processing" | "completed" | "failed";

export interface OCRItem {
  noteId: string;
  status: OCRItemStatus;
  error?: string;
  duration?: number;
}

interface BatchOCRProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OCRItem[];
  totalCount: number;
  completedCount: number;
  failedCount: number;
  isProcessing: boolean;
  onRetryFailed?: () => void;
  onClose?: () => void;
}

/**
 * OCR 배치 처리 진행 상황 다이얼로그
 * 개별 항목의 처리 상태를 실시간으로 표시
 */
export function BatchOCRProgressDialog({
  open,
  onOpenChange,
  items,
  totalCount,
  completedCount,
  failedCount,
  isProcessing,
  onRetryFailed,
  onClose,
}: BatchOCRProgressDialogProps) {
  const { t } = useTranslation();
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const processingCount = items.filter(
    (item) => item.status === "processing"
  ).length;

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      onClose?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2
              className={cn(
                "h-5 w-5",
                isProcessing && "animate-spin"
              )}
            />
            {t("admin.ocr.progressTitle")}
          </DialogTitle>
          <DialogDescription>
            {isProcessing
              ? t("admin.ocr.progressDesc", { total: totalCount, completed: completedCount, failed: failedCount })
              : t("admin.ocr.progressDone", { completed: completedCount, failed: failedCount })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 진행률 표시 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("admin.ocr.overallProgress")}</span>
              <span className="font-semibold">
                {completedCount} / {totalCount} ({Math.round(progress)}%)
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{t("admin.ocr.pending")}: {pendingCount}</span>
              <span>{t("admin.ocr.inProgress")}: {processingCount}</span>
              <span className="text-green-600">{t("admin.ocr.completed")}: {completedCount}</span>
              <span className="text-red-600">{t("admin.ocr.failed")}: {failedCount}</span>
            </div>
          </div>

          {/* 개별 항목 목록 */}
          <div className="h-[300px] overflow-y-auto rounded-md border p-4">
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  {t("admin.ocr.noItems")}
                </div>
              ) : (
                items.map((item) => (
                  <OCRItemRow key={item.noteId} item={item} />
                ))
              )}
            </div>
          </div>

          {/* 실패한 항목 재시도 버튼 */}
          {failedCount > 0 && onRetryFailed && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">
                  {t("admin.ocr.failedCount", { count: failedCount })}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryFailed}
                disabled={isProcessing}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isProcessing && "animate-spin")} />
                {isProcessing ? t("admin.ocr.retrying") : t("admin.ocr.retryFailed")}
              </Button>
            </div>
          )}

          {/* 완료 메시지 */}
          {!isProcessing && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button onClick={handleClose} variant="default">
                {t("admin.ocr.close")}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 개별 OCR 항목 행 컴포넌트
 */
function OCRItemRow({ item }: { item: OCRItem }) {
  const { t } = useTranslation();
  const getStatusIcon = () => {
    switch (item.status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "pending":
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = () => {
    switch (item.status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            {t("admin.ocr.completed")}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">{t("admin.ocr.failed")}</Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            {t("admin.ocr.inProgress")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline">{t("admin.ocr.pending")}</Badge>
        );
    }
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getStatusIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-muted-foreground">
              {item.noteId.substring(0, 8)}...
            </span>
            {getStatusBadge()}
          </div>
          {item.duration && (
            <span className="text-xs text-muted-foreground">
              {item.duration}ms
            </span>
          )}
        </div>
        {item.error && (
          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs">
            <div className="font-semibold mb-1 text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t("admin.ocr.error")}
            </div>
            <div className="break-words text-destructive/90">{item.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}
