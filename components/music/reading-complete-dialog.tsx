"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useQuickCaptureStore } from "@/hooks/use-quick-capture";
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { BookOpen, PenLine, ArrowRight, Zap, Loader2, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CONTINUE_PRESETS = [
  { label: "+15분", seconds: 15 * 60, emoji: "☕" },
  { label: "+30분", seconds: 30 * 60, emoji: "📖" },
  { label: "+60분", seconds: 60 * 60, emoji: "📚" },
] as const;

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return `${seconds}초`;
}

export function ReadingCompleteDialog() {
  const {
    isCompleteDialogOpen,
    closeCompleteDialog,
    elapsedSeconds,
    timerStartedAt,
    continueReading,
    close,
  } = useMusicPlayer();

  const quickCapture = useQuickCaptureStore();
  const { user } = useAuth();
  const { isOpen: isLoginOpen, setIsOpen: setIsLoginOpen, title: loginTitle, description: loginDesc, requireLogin } = useLoginPrompt();
  const [showContinueOptions, setShowContinueOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /** 빠른 기록: Quick Capture에 타이머 데이터를 전달하여 열기 */
  async function handleQuickRecord() {
    // 비로그인 시 가입 유도
    if (requireLogin({
      title: "독서 기록을 남기려면",
      description: "로그인 후 독서 기록을 저장할 수 있어요.",
    })) return;

    setIsSaving(true);
    try {
      closeCompleteDialog();
      // Quick Capture Sheet에 타이머 데이터 전달
      quickCapture.openWithTimer(null, elapsedSeconds);
      toast.success(`📖 ${formatDuration(elapsedSeconds)} 독서 완료!`);
    } catch {
      toast.error("기록 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleContinue(seconds: number) {
    setShowContinueOptions(false);
    continueReading(seconds);
  }

  function handleStop() {
    setShowContinueOptions(false);
    closeCompleteDialog();
    close();
  }

  return (
    <>
    <Dialog
      open={isCompleteDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowContinueOptions(false);
          closeCompleteDialog();
        }
      }}
    >
      <DialogContent className="sm:max-w-[360px] rounded-2xl p-0 overflow-hidden">
        {/* 상단 비주얼 */}
        <div className="bg-gradient-to-b from-primary/10 to-transparent px-6 pt-8 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/15 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <DialogHeader className="items-center space-y-1.5">
            <DialogTitle className="text-xl font-bold">독서 완료!</DialogTitle>
            <DialogDescription className="sr-only">독서 타이머가 완료되었습니다</DialogDescription>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-primary tabular-nums">
                {formatDuration(elapsedSeconds)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              동안 독서에 집중했습니다
            </p>
            {timerStartedAt && (
              <p className="text-[10px] text-muted-foreground/60 tabular-nums">
                {new Date(timerStartedAt).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ~{" "}
                {new Date().toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </DialogHeader>
        </div>

        {/* 액션 */}
        <div className="px-5 pb-6 space-y-2.5">
          {/* 기록하기 (메인 CTA) */}
          <button
            onClick={handleQuickRecord}
            disabled={isSaving}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <PenLine className="w-4 h-4" />
            )}
            독서 기록 남기기
          </button>

          {/* 계속 읽기 */}
          {!showContinueOptions ? (
            <button
              onClick={() => setShowContinueOptions(true)}
              className="w-full py-3 rounded-xl bg-muted font-medium text-sm hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              조금 더 읽기
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {CONTINUE_PRESETS.map(({ label, seconds, emoji }) => (
                <button
                  key={seconds}
                  onClick={() => handleContinue(seconds)}
                  className="py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-center"
                >
                  <span className="text-lg block mb-0.5">{emoji}</span>
                  <span className="text-xs font-semibold">{label}</span>
                </button>
              ))}
              <button
                onClick={() => handleContinue(Infinity)}
                className="py-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-center text-primary"
              >
                <InfinityIcon className="w-5 h-5 mx-auto mb-0.5" />
                <span className="text-xs font-semibold">무제한</span>
              </button>
            </div>
          )}

          {/* 그만 읽기 */}
          <button
            onClick={handleStop}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            그만 읽기
          </button>
        </div>
      </DialogContent>
    </Dialog>

    {/* 로그인 유도 모달 */}
    <LoginPromptModal open={isLoginOpen} onOpenChange={setIsLoginOpen} title={loginTitle} description={loginDesc} />
    </>
  );
}
