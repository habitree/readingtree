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
        toast.success("모든 책에 페이지 수가 설정되어 있습니다!");
      } else {
        toast.info(`페이지 수가 없는 책 ${result.books.length}권을 찾았습니다.`);
      }
    } catch (error) {
      toast.error("조회 중 오류가 발생했습니다.");
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
        toast.success(`${result.updated}권의 페이지 수를 업데이트했습니다.`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed}권은 페이지 수를 찾지 못했습니다.`);
      }

      // 목록 새로고침
      await checkBooksWithoutPages();
    } catch (error) {
      toast.error("업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  const sourceLabels: Record<string, string> = {
    nl_seoji: "국립중앙도서관",
    aladin: "알라딘",
    google_books: "Google Books",
  };

  const successCount = updateResults.filter((r) => r.success).length;
  const failCount = updateResults.filter((r) => !r.success).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          페이지 수 자동 조회
        </CardTitle>
        <CardDescription>
          ISBN이 있는 책들의 페이지 수를 외부 API에서 자동으로 가져옵니다.
          국립중앙도서관, 알라딘, Google Books에서 순차적으로 검색합니다.
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
            페이지 수 없는 책 확인
          </Button>

          {booksWithoutPages.length > 0 && (
            <Badge variant="secondary">
              {booksWithoutPages.length}권
            </Badge>
          )}
        </div>

        {/* 페이지 수 없는 책 목록 */}
        {booksWithoutPages.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                페이지 수가 없는 책 목록
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    일괄 조회 실행
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>페이지 수 일괄 조회</AlertDialogTitle>
                    <AlertDialogDescription>
                      최대 20권의 책 페이지 수를 외부 API에서 조회합니다.
                      API 호출 제한이 있으므로 한 번에 많은 책을 조회하지 않습니다.
                      계속하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={runBatchUpdate}>
                      실행
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
                    외 {booksWithoutPages.length - 20}권...
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
              <span>업데이트 진행 중...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* 업데이트 결과 */}
        {updateResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">업데이트 결과</span>
              {successCount > 0 && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  성공 {successCount}
                </Badge>
              )}
              {failCount > 0 && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  실패 {failCount}
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
                          ({result.source ? sourceLabels[result.source] || result.source : "알 수 없음"})
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
          <p className="font-medium mb-1">API 정보</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>국립중앙도서관: 한국 도서 공식 서지정보</li>
            <li>알라딘: 한국 최대 온라인 서점 데이터</li>
            <li>Google Books: 해외 도서 및 폴백</li>
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
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      const result = await batchUpdatePageCounts(10);

      if (result.updated > 0) {
        toast.success(`${result.updated}권 업데이트 완료`);
      } else {
        toast.info("업데이트할 책이 없습니다.");
      }
    } catch (error) {
      toast.error("업데이트 실패");
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
      페이지 수 자동 채우기
    </Button>
  );
}
