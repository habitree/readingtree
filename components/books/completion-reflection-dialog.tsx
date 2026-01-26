"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Quote,
  Lightbulb,
  ThumbsUp,
  Star,
  Sparkles,
  ChevronRight,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

/**
 * 성찰 프롬프트 정의
 * Elaborative Interrogation - 깊은 처리가 기억과 의미 증가
 */
const REFLECTION_PROMPTS = [
  {
    id: "quote",
    icon: Quote,
    label: "인상적인 문장",
    question: "이 책에서 가장 기억에 남는 문장은?",
    placeholder: "마음에 새겨진 문장을 적어보세요...",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    id: "reflection",
    icon: Lightbulb,
    label: "생각의 변화",
    question: "이 책을 읽고 달라진 생각이 있나요?",
    placeholder: "새롭게 깨달은 것, 달라진 시각을 적어보세요...",
    color: "text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    id: "recommend",
    icon: ThumbsUp,
    label: "추천",
    question: "비슷한 책을 찾는 친구에게 추천할까요?",
    placeholder: "누구에게, 왜 추천하고 싶은지 적어보세요...",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
];

interface CompletionReflectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle: string;
  bookAuthor?: string | null;
  onSubmit: (reflections: Record<string, string>) => Promise<void>;
  onSkip?: () => void;
}

/**
 * 책 완독 후 성찰 프롬프트 다이얼로그
 * 완독 시 사용자에게 성찰 기회를 제공하고 추가 포인트 보상
 */
export function CompletionReflectionDialog({
  open,
  onOpenChange,
  bookTitle,
  bookAuthor,
  onSubmit,
  onSkip,
}: CompletionReflectionDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPrompt = REFLECTION_PROMPTS[currentStep];
  const isLastStep = currentStep === REFLECTION_PROMPTS.length - 1;
  const hasAnyReflection = Object.values(reflections).some((v) => v.trim().length > 0);

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkipPrompt = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
    if (!hasAnyReflection) {
      onSkip?.();
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reflections);

      // 성찰 완료 축하 효과
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#10b981", "#059669", "#fbbf24"],
      });

      onOpenChange(false);
    } catch (error) {
      console.error("성찰 저장 오류:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (hasAnyReflection) {
      handleSubmit();
    } else {
      onSkip?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <Badge className="bg-green-500 text-white mb-1">완독 축하!</Badge>
              <DialogTitle className="text-lg">
                <span className="line-clamp-1">{bookTitle}</span>
              </DialogTitle>
              {bookAuthor && (
                <DialogDescription className="text-sm">
                  {bookAuthor}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* 진행률 표시 */}
        <div className="flex items-center gap-1 mb-4">
          {REFLECTION_PROMPTS.map((_, index) => (
            <motion.div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full",
                index <= currentStep
                  ? "bg-primary"
                  : "bg-slate-200 dark:bg-slate-700"
              )}
              initial={false}
              animate={{
                backgroundColor: index <= currentStep ? undefined : undefined,
              }}
            />
          ))}
        </div>

        {/* 성찰 프롬프트 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className={cn("p-4 rounded-lg", currentPrompt.bgColor)}>
              <div className="flex items-center gap-2 mb-3">
                <currentPrompt.icon className={cn("h-5 w-5", currentPrompt.color)} />
                <Label className="font-semibold">{currentPrompt.question}</Label>
              </div>
              <Textarea
                value={reflections[currentPrompt.id] || ""}
                onChange={(e) =>
                  setReflections((prev) => ({
                    ...prev,
                    [currentPrompt.id]: e.target.value,
                  }))
                }
                placeholder={currentPrompt.placeholder}
                className="min-h-[100px] resize-none bg-white/70 dark:bg-slate-900/50"
              />
            </div>

            {/* 보상 안내 */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Gift className="h-4 w-4 text-amber-500" />
              <span>성찰 기록 시 <span className="text-amber-600 font-medium">+15 포인트</span></span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 버튼 영역 */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" onClick={handleSkipPrompt} disabled={isSubmitting}>
            건너뛰기
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                disabled={isSubmitting}
              >
                이전
              </Button>
            )}
            <Button onClick={handleNext} disabled={isSubmitting}>
              {isLastStep ? (
                hasAnyReflection ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    저장하기
                  </>
                ) : (
                  "완료"
                )
              ) : (
                <>
                  다음
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 별점 (선택적) */}
        <div className="flex items-center justify-center gap-1 pt-4 border-t">
          <span className="text-sm text-muted-foreground mr-2">별점:</span>
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setReflections((prev) => ({ ...prev, rating: String(rating) }))}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  Number(reflections.rating) >= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                )}
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
