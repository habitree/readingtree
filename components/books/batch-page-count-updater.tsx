"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  BookOpen,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  getBooksWithoutPageCount,
  batchUpdatePageCounts,
} from "@/app/actions/books";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface UpdateResult {
  isbn: string;
  success: boolean;
  pageCount?: number;
  source?: string;
  error?: string;
}

/**
 * 페이지 수 일괄 업데이트 컴포넌트
 * 설정 페이지나 관리 페이지에서 사용
 */
export function BatchPageCountUpdater() {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [isChecking, setIsChecking] = useState(false);
  const [booksWithoutPages, setBooksWithoutPages] = useState<
    Array<{ id: string; isbn: string; title: string }>
  >([]);
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  // 페이지 수 없는 책 확인
  const checkBooksWithoutPages = async () => {
    setIsChecking(true);
    setBooksWithoutPages([]);
    setUpdateResults([]);

    try {
      const result = await getBooksWithoutPageCount(100);
      setBooksWithoutPages(result.books);

      if (result.books.length === 0) {
        toast.success(t("admin.batchPageCount.allHavePages"));
      } else {
        toast.info(t("admin.batchPageCount.foundWithout", { count: result.books.length }));
      }
    } catch (error) {
      toast.error(t("admin.batchPageCount.fetchError"));
    } finally {
      setIsChecking(false);
    }
  };

  // 일괄 업데이트 실행
  const runBatchUpdate = async () => {
    setIsUpdating(true);
    setProgress(0);
    setUpdateResults([]);

    try {
      const result = await batchUpdatePageCounts(20);
      setUpdateResults(result.results);
      setProgress(100);

      if (result.updated > 0) {
        toast.success(t("admin.batchPageCount.updatedCount", { count: result.updated }));
      }
      if (result.failed > 0) {
        toast.warning(t("admin.batchPageCount.failedCount", { count: result.failed }));
      }

      // 목록 새로고침
      await checkBooksWithoutPages();
    } catch (error) {
      toast.error(t("admin.batchPageCount.updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const sourceLabels: Record<string, string> = {
    nl_seoji: t("admin.batchPageCount.sourceNl"),
    aladin: t("admin.batchPageCount.sourceAladin"),
    google_books: "Google Books",
  };

  const successCount = updateResults.filter((r) => r.success).length;
  const failCount = updateResults.filter((r) => !r.success).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          {t("admin.batchPageCount.title")}
        </CardTitle>
        <CardDescription>
          {t("admin.batchPageCount.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 확인 버튼 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={checkBooksWithoutPages}
            disabled={isChecking || isUpdating}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4 mr-2" />
            )}
            {t("admin.batchPageCount.checkButton")}
          </Button>

          {booksWithoutPages.length > 0 && (
            <Badge variant="secondary">
              {t("books.bookCount", { count: booksWithoutPages.length })}
            </Badge>
          )}
        </div>

        {/* 페이지 수 없는 책 목록 */}
        {booksWithoutPages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("admin.batchPageCount.booksWithoutPages")}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {t("admin.batchPageCount.batchRunButton")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("admin.batchPageCount.dialogTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("admin.batchPageCount.dialogDescription")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={runBatchUpdate}>
                      {t("admin.batchPageCount.run")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="space-y-2">
                {booksWithoutPages.slice(0, 20).map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1">{book.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {book.isbn}
                    </Badge>
                  </div>
                ))}
                {booksWithoutPages.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    {t("admin.batchPageCount.andMore", { count: booksWithoutPages.length - 20 })}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 업데이트 진행 상황 */}
        {isUpdating && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t("admin.batchPageCount.updating")}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* 업데이트 결과 */}
        {updateResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{t("admin.batchPageCount.results")}</span>
              {successCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t("admin.batchPageCount.success", { count: successCount })}
                </Badge>
              )}
              {failCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {t("admin.batchPageCount.fail", { count: failCount })}
                </Badge>
              )}
            </div>

            <ScrollArea className="h-48 rounded-md border p-3">
              <div className="space-y-2">
                {updateResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm"
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <Badge variant="outline" className="text-xs shrink-0">
                      {result.isbn}
                    </Badge>
                    {result.success ? (
                      <>
                        <span className="text-green-600">
                          {result.pageCount}p
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({result.source ? sourceLabels[result.source] || result.source : t("admin.batchPageCount.unknown")})
                        </span>
                      </>
                    ) : (
                      <span className="text-red-500 text-xs truncate">
                        {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">{t("admin.batchPageCount.apiInfoTitle")}</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>{t("admin.batchPageCount.apiNl")}</li>
            <li>{t("admin.batchPageCount.apiAladin")}</li>
            <li>{t("admin.batchPageCount.apiGoogle")}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 간단한 배치 업데이트 버튼 (컴팩트 버전)
 */
export function BatchUpdateButton() {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      const result = await batchUpdatePageCounts(10);

      if (result.updated > 0) {
        toast.success(t("admin.batchPageCount.updateComplete", { count: result.updated }));
      } else {
        toast.info(t("admin.batchPageCount.nothingToUpdate"));
      }
    } catch (error) {
      toast.error(t("admin.batchPageCount.updateFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUpdate}
      disabled={isUpdating}
    >
      {isUpdating ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      {t("admin.batchPageCount.autoFill")}
    </Button>
  );
}
