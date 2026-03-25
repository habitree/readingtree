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
import { cn } from "@/lib/utils";
import { updateBookStatus } from "@/app/actions/books";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface BookCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userBookId: string;
  bookTitle: string;
  bookAuthor?: string | null;
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
  onCompleted,
  onDismiss,
}: BookCompletionDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // 다이얼로그 열릴 때 초기 confetti
  useEffect(() => {
    if (open) {
      setShowCelebration(false);
      // 작은 confetti로 주의 끌기
      setTimeout(() => {
        confetti({
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
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#f59e0b"],
        });
        confetti({
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
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5 },
          colors: ["#22c55e", "#10b981", "#059669", "#fbbf24", "#a855f7"],
        });
      }, 500);

      // 축하 화면 표시 후 완료 처리
      setTimeout(() => {
        toast.success("완독을 축하합니다!", { duration: 4000 });
        onOpenChange(false);
        onCompleted?.();
      }, 2500);
    } catch (error) {
      toast.error("완독 처리 중 오류가 발생했습니다.");
      setIsConfirming(false);
    }
  };

  const handleDismiss = () => {
    onOpenChange(false);
    onDismiss?.();
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
                마지막 페이지까지 도달했어요!
                <br />
                완독으로 기록할까요?
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
            // 축하 화면
            <motion.div
              key="celebration"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="py-8 text-center"
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                🎉
              </motion.div>
              <motion.h2
                className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                축하합니다!
              </motion.h2>
              <motion.p
                className="text-muted-foreground mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="font-medium text-foreground">{bookTitle}</span>
                <br />
                완독을 기록했어요
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
