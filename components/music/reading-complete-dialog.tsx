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
import { useAuth } from "@/hooks/use-auth";
import { useLoginPrompt } from "@/hooks/use-login-prompt";
import { LoginPromptModal } from "@/components/ui/login-prompt-modal";
import { saveReadingSession } from "@/app/actions/progress";
import { useStampCaptureStore } from "@/hooks/use-stamp-capture";
import { useRecordSheetStore, type RecordSheetBook } from "@/hooks/use-record-sheet";
import { useReadingSession } from "@/hooks/use-reading-session";
import { showSaveSuccessToast } from "@/lib/utils/stamp-toast";
import { isRecordV2Enabled } from "@/lib/feature-flags";
import {
  BookOpen,
  PenLine,
  ArrowRight,
  Loader2,
  Stamp as StampIcon,
  Infinity as InfinityIcon,
} from "lucide-react";
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
    activeBook,
  } = useMusicPlayer();

  const { user } = useAuth();
  const {
    isOpen: isLoginOpen,
    setIsOpen: setIsLoginOpen,
    title: loginTitle,
    description: loginDesc,
    requireLogin,
  } = useLoginPrompt();
  const [showContinueOptions, setShowContinueOptions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [memo, setMemo] = useState("");
  const openStampWithTimer = useStampCaptureStore((s) => s.openWithTimer);
  const openStampAttach = useStampCaptureStore((s) => s.openAttach);
  const openRecordStart = useRecordSheetStore((s) => s.openStart);
  const openRecordEnd = useRecordSheetStore((s) => s.openEnd);
  const { session: activeSession } = useReadingSession();

  function buildBookForStamp(): RecordSheetBook | null {
    return activeBook
      ? {
          id: activeBook.userBookId,
          bookId: activeBook.bookId,
          title: activeBook.title,
          author: null,
          coverImageUrl: activeBook.coverUrl,
          totalPages: null,
        }
      : null;
  }

  /**
   * 메인 CTA: 기록하기
   *  - V2 카나리 + 진행 중 세션 있음 → end-step 자동 진입
   *  - V2 카나리 + 세션 없음 → start-step (음악 시간 prefill)
   *  - Legacy → 기존 StampCaptureSheet 열기
   */
  function handleOpenRecord() {
    if (
      requireLogin({
        title: "독서 기록을 남기려면",
        description: "로그인 후 독서 기록을 저장할 수 있어요.",
      })
    )
      return;

    if (isRecordV2Enabled()) {
      const book = buildBookForStamp();
      if (activeSession) {
        openRecordEnd(activeSession.id, { book });
      } else {
        openRecordStart({ book, targetSeconds: elapsedSeconds });
      }
      closeCompleteDialog();
      close();
      return;
    }

    openStampWithTimer(buildBookForStamp(), elapsedSeconds);
    closeCompleteDialog();
    close();
  }

  function handleContinue(seconds: number) {
    setShowContinueOptions(false);
    continueReading(seconds);
  }

  /** 그만 읽기 — 로그인 상태 + 30초 이상이면 자동 저장 + 토스트 "사진 추가" 액션 */
  async function handleStop() {
    setShowContinueOptions(false);

    if (user && elapsedSeconds >= 30 && timerStartedAt) {
      try {
        const result = await saveReadingSession({
          durationSeconds: elapsedSeconds,
          startedAt: timerStartedAt,
          userBookId: activeBook?.userBookId,
          memo: memo.trim() || undefined,
        });

        const book = buildBookForStamp();
        showSaveSuccessToast({
          logId: result.logId,
          hasImage: false,
          title: activeBook
            ? `${formatDuration(elapsedSeconds)} 「${activeBook.title}」 자동 저장`
            : `${formatDuration(elapsedSeconds)} 독서 시간이 자동 저장됐어요`,
          onAddPhoto: (logId) => {
            openStampAttach(logId, {
              book,
              durationSeconds: elapsedSeconds,
            });
          },
        });
      } catch {
        // 자동 저장 실패는 조용히 처리
      }
    }

    setMemo("");
    setShowMemo(false);
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
            setShowMemo(false);
            setMemo("");
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
              <DialogTitle className="text-xl font-bold">
                독서 완료!
              </DialogTitle>
              <DialogDescription className="sr-only">
                독서 타이머가 완료되었습니다
              </DialogDescription>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold text-primary tabular-nums">
                  {formatDuration(elapsedSeconds)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                동안 독서에 집중했습니다
              </p>
              {activeBook && (
                <p className="text-xs text-muted-foreground/80 mt-1">
                  📖 {activeBook.title}
                </p>
              )}
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
            {/* 메인 CTA: 기록하기 (페이지·시간·사진 모두 시트 안에서) */}
            <button
              onClick={handleOpenRecord}
              disabled={isSaving}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <StampIcon className="w-4 h-4" />
              )}
              기록하기
            </button>

            {/* 메모 남기기 (인라인 토글) */}
            {!showMemo ? (
              <button
                onClick={() => setShowMemo(true)}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-muted font-medium text-sm hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
              >
                <PenLine className="w-3.5 h-3.5" />
                메모 남기기
              </button>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="오늘 독서에서 인상적이었던 것..."
                  maxLength={200}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border bg-background text-sm resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] text-muted-foreground">{memo.length}/200</span>
                  <button
                    onClick={() => { setShowMemo(false); setMemo(""); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

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

            {/* 그만 읽기 (30초+ 자동 저장) */}
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
      <LoginPromptModal
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        title={loginTitle}
        description={loginDesc}
      />
    </>
  );
}
