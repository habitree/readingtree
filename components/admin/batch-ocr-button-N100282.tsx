"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ScanLine, RefreshCw } from "lucide-react";
import { batchProcessOCR, getPendingOCRCount } from "@/app/actions/admin";
import { getTranscription } from "@/app/actions/notes";
import { toast } from "sonner";
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
      toast.info(`OCR 처리가 필요한 기록: ${result.needingOCR}개`);
    } catch (error) {
      console.error("OCR 대기 기록 수 조회 오류:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "OCR 대기 기록 수 조회에 실패했습니다."
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
                  error: transcription.error || "OCR 처리 실패",
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
    setCompletedCount(0);
    setFailedCount(0);
    setProgressItems([]);
    processingNoteIdsRef.current.clear();

    try {
      // 배치 처리 시작 전에 대기 중인 기록 조회
      const pendingResult = await getPendingOCRCount();
      const batchSize = Math.min(10, pendingResult.needingOCR);
      
      if (batchSize === 0) {
        toast.info("OCR 처리가 필요한 기록이 없습니다.");
        setIsProcessing(false);
        setShowProgress(false);
        setIsLoading(false);
        return;
      }

      setTotalCount(batchSize);
      
      // 배치 처리 실행
      const result = await batchProcessOCR(batchSize);
      
      // 결과를 OCRItem 형식으로 변환
      const items: OCRItem[] = (result.items || []).map((item) => {
        const status: OCRItem["status"] = item.success
          ? "completed"
          : item.error
          ? "failed"
          : "processing";

        // 처리 중인 항목은 폴링 대상에 추가 (현재는 모든 항목이 완료/실패 상태)
        // 하지만 transcription 상태가 아직 업데이트되지 않았을 수 있으므로 확인
        if (status === "processing" || !item.success) {
          // 실패한 항목도 transcription 상태를 확인해야 함
          processingNoteIdsRef.current.add(item.noteId);
        }

        return {
          noteId: item.noteId,
          status,
          error: item.error,
          duration: item.duration,
        };
      });

      setProgressItems(items);
      setCompletedCount(result.processedCount ?? 0);
      setFailedCount(result.failedCount ?? 0);

      // 모든 항목이 완료/실패된 경우에도 transcription 상태를 한 번 더 확인
      // (서버에서 완료되었지만 DB 업데이트가 지연될 수 있음)
      if (processingNoteIdsRef.current.size > 0) {
        // 폴링이 계속 진행됨
      } else {
        setIsProcessing(false);
      }

      // 성공 메시지
      if (result.failedCount === 0) {
        toast.success(result.message);
      } else {
        toast.warning(result.message);
      }

      setPendingCount(null); // 카운트 초기화 (다시 확인 필요)
      setIsLoading(false);
    } catch (error) {
      console.error("OCR 배치 처리 오류:", error);
      setIsProcessing(false);
      setIsLoading(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "OCR 배치 처리에 실패했습니다."
      );
    }
  };

  const handleRetryFailed = async () => {
    // 실패한 항목만 다시 처리
    const failedItems = progressItems.filter(item => item.status === "failed");
    
    if (failedItems.length === 0) {
      toast.info("재시도할 실패 항목이 없습니다.");
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
        toast.success("모든 실패 항목이 성공적으로 재처리되었습니다.");
      } else {
        toast.warning(`${processedCount}개 재처리 성공, ${failedCount}개 여전히 실패`);
      }
    } catch (error) {
      console.error("OCR 재시도 오류:", error);
      setIsProcessing(false);
      toast.error(
        error instanceof Error
          ? error.message
          : "OCR 재시도에 실패했습니다."
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
          대기 기록 확인
          {pendingCount !== null && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({pendingCount}개)
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
              OCR 배치 처리
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>OCR 배치 처리</AlertDialogTitle>
              <AlertDialogDescription>
                이미지가 있지만 OCR 처리가 안 된 모든 기록을 일괄 처리합니다.
                <br />
                <span className="text-muted-foreground text-sm">
                  한 번에 최대 10개씩 처리되며, 처리 시간이 소요될 수 있습니다.
                </span>
                {pendingCount !== null && (
                  <div className="mt-2 text-sm font-semibold text-primary">
                    처리 대기 중인 기록: {pendingCount}개
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchProcess}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "확인 및 실행"
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
