"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, BookOpen, PartyPopper, Loader2 } from "lucide-react";
import { updateBookStatus } from "@/app/actions/books";
import { notify } from "@/lib/toast";
import { CompletionCelebrationCard } from "./completion-celebration-card";

interface BookCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userBookId: string;
  bookTitle: string;
  bookAuthor?: string | null;
  bookCoverUrl?: string | null;
  /** 현재까지 완독한 횟수 (completed_dates 배열 길이) */
  completedCount?: number;
  /** 완독 확정 후 콜백 */
  onCompleted?: () => void;
  /** 완독 취소 (아직 읽는 중) 콜백 */
  onDismiss?: () => void;
}

/**
 * 100% 진행 시 완독 확인 다이얼로그
 * - 축하 모션 (confetti)
 * - 완독 처리 or 계속 읽기 선택
 */
export function BookCompletionDialog({
  open,
  onOpenChange,
  userBookId,
  bookTitle,
  bookAuthor,
  bookCoverUrl,
  completedCount = 0,
  onCompleted,
  onDismiss,
}: BookCompletionDialogProps) {
  // 다음 회독 번호 (0회 완독 → 1회독, 1회 완독 → 2회독, ...)
  const nextReadCount = completedCount + 1;
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // confetti를 dynamic import로 실행하는 헬퍼
  const fireConfetti = (options: Record<string, unknown>) => {
    import("canvas-confetti").then((m) => m.default(options as Parameters<typeof m.default>[0]));
  };

  // 다이얼로그 열릴 때 초기 confetti
  useEffect(() => {
    if (open) {
      setShowCelebration(false);
      // 작은 confetti로 주의 끌기
      setTimeout(() => {
        fireConfetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#22c55e", "#10b981", "#fbbf24", "#f59e0b"],
        });
      }, 300);
    }
  }, [open]);

  const handleConfirmCompletion = async () => {
    setIsConfirming(true);
    try {
      await updateBookStatus(userBookId, "completed");

      // 축하 애니메이션 시작
      setShowCelebration(true);

      // 큰 confetti 폭발
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        fireConfetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#f59e0b"],
        });
        fireConfetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // 큰 중앙 폭발
      setTimeout(() => {
        fireConfetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#a855f7"],
        });
      }, 500);

      // 서버 완독 처리는 끝났지만 축하 카드는 사용자가 닫을 때까지 유지.
      // onCompleted 콜백(서재 갱신·리로드 등)은 카드 닫힘 시점에 호출한다.
    } catch (error) {
      notify.error("완독 처리 중 오류가 발생했어요");
      setIsConfirming(false);
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
    onDismiss?.();
  };

  const handleCloseCelebration = () => {
    onOpenChange(false);
    onCompleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-sm">
        <AnimatePresence mode="wait">
          {!showCelebration ? (
            // 확인 화면
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="items-center text-center pb-2">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                >
                  <Trophy className="h-8 w-8 text-white" />
                </motion.div>
                <DialogTitle className="text-xl">
                  완독하셨나요?
                </DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  <span className="font-medium text-foreground">{bookTitle}</span>
                  {bookAuthor && (
                    <span className="text-muted-foreground"> · {bookAuthor}</span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <motion.p
                className="text-center text-sm text-muted-foreground mt-2 mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {completedCount > 0 ? (
                  <>
                    {nextReadCount}회독을 마치셨군요!
                    <br />
                    완독으로 기록할까요?
                  </>
                ) : (
                  <>
                    마지막 페이지까지 도달했어요!
                    <br />
                    완독으로 기록할까요?
                  </>
                )}
              </motion.p>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleConfirmCompletion}
                  disabled={isConfirming}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md"
                  size="lg"
                >
                  {isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <PartyPopper className="h-4 w-4 mr-2" />
                  )}
                  네, 완독했어요!
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isConfirming}
                  className="w-full text-muted-foreground"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  아직 읽고 있어요
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="celebration"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <CompletionCelebrationCard
                userBookId={userBookId}
                bookTitle={bookTitle}
                bookAuthor={bookAuthor}
                bookCoverUrl={bookCoverUrl}
                totalReadCount={nextReadCount}
                onClose={handleCloseCelebration}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
