"use client";

/**
 * 타이머 완료 알림 다이얼로그
 *
 * 진행 중 세션의 elapsedSeconds 가 target_seconds 에 도달하면 알림.
 *  - "계속 진행" → 다이얼로그만 닫고 세션 유지 (해당 세션은 재알림 없음)
 *  - "지금 종료" → endReadingSession 즉시 저장
 *  - 사용자가 30초 동안 응답이 없으면 자동으로 "지금 종료" 와 동일하게 저장
 *
 * 자동 저장 시 end_page 는 시작 페이지 그대로 (사용자 입력 없음).
 * target_seconds 가 보통 ≥ 15분이므로 3분 자동 폐기 임계값에는 걸리지 않음.
 *
 * (main) layout 에 항상 마운트되어 세션 상태를 감시한다. 다이얼로그 본체는 open 시에만 렌더.
 */

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Play, Save } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { endReadingSession } from "@/app/actions/sessions";
import {
  broadcastSessionEnded,
  useReadingSession,
} from "@/hooks/use-reading-session";

/** 자동 종료까지의 카운트다운 (초) */
const AUTO_END_COUNTDOWN_S = 30;

export function RecordTimerCompleteDialog() {
  const { session, elapsedSeconds, broadcastEnd } = useReadingSession();
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_END_COUNTDOWN_S);
  const [isSaving, startSave] = useTransition();

  // 세션당 알림은 1회만 — 노출/연장 이력 추적
  const alertedSessionsRef = useRef<Set<string>>(new Set());
  const continuedSessionsRef = useRef<Set<string>>(new Set());

  const target = session?.target_seconds ?? 0;
  const sessionId = session?.id ?? null;
  const isTimerExceeded = !!sessionId && target > 0 && elapsedSeconds >= target;

  // 시간 도달 감지 → 알림 오픈
  useEffect(() => {
    if (!sessionId) {
      if (open) setOpen(false);
      return;
    }
    if (!isTimerExceeded) return;
    if (continuedSessionsRef.current.has(sessionId)) return;
    if (alertedSessionsRef.current.has(sessionId)) return;

    alertedSessionsRef.current.add(sessionId);
    setCountdown(AUTO_END_COUNTDOWN_S);
    setOpen(true);
  }, [sessionId, isTimerExceeded, open]);

  function handleEnd() {
    if (!session) return;
    startSave(async () => {
      try {
        const startPage = session.start_page ?? session.page_number ?? 0;
        const result = await endReadingSession({
          session_id: session.id,
          end_page: startPage,
          is_public: true,
        });
        broadcastEnd(result.sessionId);
        broadcastSessionEnded(result.sessionId);

        if (result.discarded) {
          toast.info("기록 시간이 너무 짧아 저장하지 않았어요.");
        } else {
          const minutes = Math.round(result.durationSeconds / 60);
          toast.success(`설정한 시간 도달 · 자동 저장 (${minutes}분)`);
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "자동 저장에 실패했어요.",
        );
      } finally {
        setOpen(false);
      }
    });
  }

  function handleContinue() {
    if (sessionId) continuedSessionsRef.current.add(sessionId);
    setOpen(false);
    toast.message("계속 진행해요. 마무리는 직접 종료 버튼으로 해주세요.");
  }

  // 카운트다운 → 0 도달 시 자동 종료 (저장)
  useEffect(() => {
    if (!open) return;
    if (isSaving) return;
    if (countdown <= 0) {
      handleEnd();
      return;
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // handleEnd 는 안정적이지 않지만, countdown 변화 외 트리거를 피하려고 일부러 deps 최소화.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, countdown, isSaving]);

  const targetMinutes = Math.max(1, Math.round(target / 60));
  const elapsedMinutes = Math.max(targetMinutes, Math.round(elapsedSeconds / 60));

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isSaving) handleContinue();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>설정한 시간이 끝났어요</AlertDialogTitle>
          <AlertDialogDescription>
            예상 시간 {targetMinutes}분이 지났어요 (현재 {elapsedMinutes}분).
            <br />
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {countdown}초
            </span>
            {" "}뒤 자동으로 기록이 저장돼요. 더 읽으려면 “계속 진행”을 눌러주세요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isSaving}
            onClick={handleContinue}
            className="gap-1"
          >
            <Play className="h-3.5 w-3.5" />
            계속 진행
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isSaving}
            onClick={(e) => {
              e.preventDefault();
              handleEnd();
            }}
            className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            지금 종료
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
