"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, RefreshCw } from "lucide-react";
import { batchProcessOCR, getPendingOCRCount } from "@/app/actions/admin";
import { getTranscription } from "@/app/actions/notes";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
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
import { BatchOCRProgressDialog, type OCRItem } from "./batch-ocr-progress-dialog";

/**
 * OCR 배치 처리 버튼 컴포넌트
 * 관리자 전용
 */
export function BatchOCRButton() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // 진행 상황 다이얼로그 상태
  const [showProgress, setShowProgress] = useState(false);
  const [progressItems, setProgressItems] = useState<OCRItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleCheckPending = async () => {
    setIsChecking(true);
    try {
      const result = await getPendingOCRCount();
      setPendingCount(result.needingOCR);
      toast.info(t("admin.ocr.pendingOcrCount", { count: result.needingOCR }));
    } catch (error) {
      console.error("OCR 대기 기록 수 조회 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.ocr.checkError")
      );
    } finally {
      setIsChecking(false);
    }
  };

  // 폴링을 위한 ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingNoteIdsRef = useRef<Set<string>>(new Set());

  // 실시간 상태 업데이트를 위한 폴링
  useEffect(() => {
    if (!isProcessing || processingNoteIdsRef.current.size === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // 3초마다 상태 확인
    pollingIntervalRef.current = setInterval(async () => {
      const noteIds = Array.from(processingNoteIdsRef.current);
      
      // 각 noteId의 transcription 상태 확인
      const statusChecks = await Promise.allSettled(
        noteIds.map(async (noteId) => {
          try {
            const transcription = await getTranscription(noteId);
            return { noteId, transcription };
          } catch (error) {
            return { noteId, transcription: null };
          }
        })
      );

      // 상태 업데이트
      setProgressItems((prevItems) => {
        const updatedItems = prevItems.map((item) => {
          if (item.status !== "processing") return item;
          
          const checkResult = statusChecks.find(
            (result) =>
              result.status === "fulfilled" &&
              result.value.noteId === item.noteId
          );

          if (checkResult?.status === "fulfilled") {
            const { transcription } = checkResult.value;
            
            if (transcription) {
              if (transcription.status === "completed") {
                processingNoteIdsRef.current.delete(item.noteId);
                return { ...item, status: "completed" as const };
              } else if (transcription.status === "failed") {
                processingNoteIdsRef.current.delete(item.noteId);
                return {
                  ...item,
                  status: "failed" as const,
                  error: transcription.error || t("notes.ocrFailed"),
                };
              }
            }
          }
          
          return item;
        });

        // 완료/실패 카운트 업데이트
        const completed = updatedItems.filter(
          (item) => item.status === "completed"
        ).length;
        const failed = updatedItems.filter(
          (item) => item.status === "failed"
        ).length;

        setCompletedCount(completed);
        setFailedCount(failed);

        // 모든 항목이 완료되면 폴링 중지
        if (processingNoteIdsRef.current.size === 0) {
          setIsProcessing(false);
        }

        return updatedItems;
      });
    }, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isProcessing]);

  const handleBatchProcess = async () => {
    setIsLoading(true);
    setIsProcessing(true);
    setShowProgress(true);
    
    // 초기 상태 설정
    let totalCompleted = 0;
    let totalFailed = 0;
    const allProcessedItems: OCRItem[] = [];
    processingNoteIdsRef.current.clear();

    try {
      // 모든 대기 중인 기록을 처리할 때까지 반복
      while (true) {
        // 대기 중인 기록 조회
        const pendingResult = await getPendingOCRCount();
        
        if (pendingResult.needingOCR === 0) {
          // 더 이상 처리할 기록이 없으면 종료
          break;
        }

        // 배치 크기 설정 (최대 50개)
        const batchSize = Math.min(50, pendingResult.needingOCR);
        setTotalCount(totalCompleted + totalFailed + batchSize);
        
        // 배치 처리 실행
        const result = await batchProcessOCR(batchSize);
        
        // 결과를 OCRItem 형식으로 변환
        const items: OCRItem[] = (result.items || []).map((item) => {
          const status: OCRItem["status"] = item.success
            ? "completed"
            : item.error
            ? "failed"
            : "processing";

          // 실패한 항목은 무시하고 건너뛰기 (폴링 대상에 추가하지 않음)
          if (status === "processing") {
            processingNoteIdsRef.current.add(item.noteId);
          }

          return {
            noteId: item.noteId,
            status,
            error: item.error,
            duration: item.duration,
          };
        });

        // 전체 결과에 추가
        allProcessedItems.push(...items);
        totalCompleted += result.processedCount ?? 0;
        totalFailed += result.failedCount ?? 0;

        // 진행 상황 업데이트
        setProgressItems([...allProcessedItems]);
        setCompletedCount(totalCompleted);
        setFailedCount(totalFailed);

        // 실패한 항목은 무시하고 계속 진행
        // 성공한 항목만 카운트에 반영
        if (result.processedCount === 0 && result.failedCount > 0) {
          // 모든 항목이 실패한 경우에만 경고 (하지만 계속 진행)
          console.warn(`배치 처리 중 ${result.failedCount}개 항목 실패, 계속 진행합니다.`);
        }

        // 짧은 대기 후 다음 배치 처리 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 모든 배치 처리 완료
      setIsProcessing(false);
      setIsLoading(false);

      // 최종 결과 메시지
      if (totalFailed === 0) {
        toast.success(t("admin.ocr.allSuccess", { count: totalCompleted }));
      } else {
        toast.warning(t("admin.ocr.partialSuccess", { success: totalCompleted, failed: totalFailed }));
      }

      setPendingCount(null); // 카운트 초기화
    } catch (error) {
      console.error("OCR 배치 처리 오류:", error);
      setIsProcessing(false);
      setIsLoading(false);
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.ocr.ocrFailed")
      );
    }
  };

  const handleRetryFailed = async () => {
    // 실패한 항목만 다시 처리
    const failedItems = progressItems.filter(item => item.status === "failed");
    
    if (failedItems.length === 0) {
      toast.info(t("admin.ocr.retryNoItems"));
      return;
    }

    setIsProcessing(true);
    setCompletedCount(0);
    setFailedCount(0);
    
    // 실패한 항목들을 pending으로 변경
    const updatedItems = progressItems.map(item => 
      item.status === "failed" ? { ...item, status: "pending" as const } : item
    );
    setProgressItems(updatedItems);
    setTotalCount(failedItems.length);

    try {
      // 실패한 항목들만 다시 처리 (배치 크기를 실패 항목 수로 설정)
      const result = await batchProcessOCR(failedItems.length);
      
      // 결과 업데이트
      const resultMap = new Map(
        (result.items || []).map(item => [item.noteId, item])
      );
      
      const finalItems = progressItems.map(item => {
        if (item.status === "failed" && resultMap.has(item.noteId)) {
          const resultItem = resultMap.get(item.noteId)!;
          return {
            noteId: item.noteId,
            status: resultItem.success ? "completed" as const : "failed" as const,
            error: resultItem.error,
            duration: resultItem.duration,
          };
        }
        return item;
      });
      
      setProgressItems(finalItems);
      setCompletedCount(result.processedCount ?? 0);
      setFailedCount(result.failedCount ?? 0);
      setIsProcessing(false);
      
      const failedCount = result.failedCount ?? 0;
      const processedCount = result.processedCount ?? 0;
      
      if (failedCount === 0) {
        toast.success(t("admin.ocr.retryAllSuccess"));
      } else {
        toast.warning(t("admin.ocr.retryPartialSuccess", { success: processedCount, failed: failedCount }));
      }
    } catch (error) {
      console.error("OCR 재시도 오류:", error);
      setIsProcessing(false);
      toast.error(
        error instanceof Error
          ? error.message
          : t("admin.ocr.retryFailed2")
      );
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckPending}
          disabled={isChecking}
          className="inline-flex items-center gap-2"
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t("admin.ocr.checkPending")}
          {pendingCount !== null && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({pendingCount}{t("common.count")})
            </span>
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={isLoading}
              className="inline-flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanLine className="h-4 w-4" />
              )}
              {t("admin.ocr.batchOcr")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("admin.ocr.batchOcr")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("admin.ocr.batchOcrDesc")}
                <br />
                <span className="text-muted-foreground text-sm">
                  {t("admin.ocr.batchOcrDetail")}
                  <br />
                  {t("admin.ocr.batchOcrSkip")}
                </span>
                {pendingCount !== null && (
                  <div className="mt-2 text-sm font-semibold text-primary">
                    {t("admin.ocr.pendingCount", { count: pendingCount })}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchProcess}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("admin.ocr.processing")}
                  </>
                ) : (
                  t("admin.ocr.confirmAndRun")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 진행 상황 다이얼로그 */}
      <BatchOCRProgressDialog
        open={showProgress}
        onOpenChange={setShowProgress}
        items={progressItems}
        totalCount={totalCount}
        completedCount={completedCount}
        failedCount={failedCount}
        isProcessing={isProcessing}
        onRetryFailed={handleRetryFailed}
        onClose={() => {
          setProgressItems([]);
          setTotalCount(0);
          setCompletedCount(0);
          setFailedCount(0);
        }}
      />
    </>
  );
}
