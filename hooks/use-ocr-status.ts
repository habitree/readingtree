"use client";

import { useState, useEffect, useRef } from "react";
import { getTranscription, updateTranscriptionStatus } from "@/app/actions/notes";

type OCRStatus = "processing" | "completed" | "failed" | null;

interface UseOCRStatusOptions {
  noteId: string;
  enabled?: boolean;
  pollInterval?: number;
  onComplete?: () => void;
  /** 서버에서 받은 초기 OCR 상태 — completed/failed면 폴링하지 않음 */
  initialStatus?: OCRStatus;
}

/**
 * OCR 처리 상태를 확인하는 훅
 * 주기적으로 기록을 확인하여 OCR 결과가 있는지 체크
 * 10분 이상 processing 상태인 경우 자동으로 failed로 변경
 *
 * 중요: onComplete는 processing → completed 전환 시에만 호출됨
 * (이미 완료된 상태에서 마운트 시에는 호출되지 않음)
 */
export function useOCRStatus({
  noteId,
  enabled = true,
  pollInterval = 3000, // 3초마다 확인
  onComplete,
  initialStatus,
}: UseOCRStatusOptions) {
  const [status, setStatus] = useState<OCRStatus>(initialStatus ?? null);

  // 이미 완료/실패 상태면 폴링 불필요
  const needsPolling = enabled && initialStatus !== "completed" && initialStatus !== "failed";
  const pollCountRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  const isFirstCheckRef = useRef(true); // 첫 번째 확인인지 추적
  const wasProcessingRef = useRef(false); // processing 상태였는지 추적
  const maxPolls = 40; // 최대 40회 (약 2분)
  const TIMEOUT_MINUTES = 10; // 10분 타임아웃
  const TIMEOUT_MS = TIMEOUT_MINUTES * 60 * 1000; // 10분을 밀리초로 변환

  // onComplete ref 업데이트
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!needsPolling || !noteId) {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isMounted = true;
    pollCountRef.current = 0;
    isFirstCheckRef.current = true;
    wasProcessingRef.current = false;

    const checkOCRStatus = async () => {
      if (!isMounted) return;

      try {
        const transcription = await getTranscription(noteId);

        if (!transcription) {
          // transcription이 없으면 처리 중
          wasProcessingRef.current = true; // processing 상태 기록
          if (pollCountRef.current === 0 && isMounted) {
            setStatus("processing");
          }
          pollCountRef.current++;
          isFirstCheckRef.current = false;

          // 최대 폴링 횟수 초과 시 실패로 처리
          if (pollCountRef.current >= maxPolls && isMounted) {
            setStatus("failed");
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
          return;
        }

        // transcription 상태에 따라 상태 설정
        if (transcription.status === "completed") {
          if (isMounted) {
            setStatus("completed");
            if (intervalId) {
              clearInterval(intervalId);
            }
            // 첫 확인 시 이미 완료된 상태이면 onComplete 호출하지 않음
            // processing 상태를 거친 경우에만 onComplete 호출
            if (!isFirstCheckRef.current && wasProcessingRef.current && onCompleteRef.current) {
              onCompleteRef.current();
            }
          }
          isFirstCheckRef.current = false;
        } else if (transcription.status === "failed") {
          if (isMounted) {
            setStatus("failed");
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        } else {
          // processing 상태
          wasProcessingRef.current = true; // processing 상태 기록
          isFirstCheckRef.current = false;

          // 10분 이상 지속된 경우 자동으로 failed로 변경
          if (transcription.created_at) {
            const createdAt = new Date(transcription.created_at).getTime();
            const now = Date.now();
            const elapsed = now - createdAt;

            if (elapsed >= TIMEOUT_MS) {
              // 10분 이상 지속된 경우 failed로 변경
              console.warn(`[useOCRStatus] OCR 처리 타임아웃: noteId=${noteId}, 경과시간=${Math.round(elapsed / 1000)}초`);

              try {
                await updateTranscriptionStatus(noteId, "failed");
                console.log(`[useOCRStatus] OCR 상태를 'failed'로 업데이트 완료: noteId=${noteId}`);
              } catch (error) {
                console.error("[useOCRStatus] OCR 상태 업데이트 실패:", error);
              }

              if (isMounted) {
                setStatus("failed");
                if (intervalId) {
                  clearInterval(intervalId);
                }
              }
              return;
            }
          }

          if (isMounted) {
            setStatus("processing");
          }
          pollCountRef.current++;

          // 최대 폴링 횟수 초과 시 실패로 처리 (기존 로직 유지)
          if (pollCountRef.current >= maxPolls && isMounted) {
            setStatus("failed");
            if (intervalId) {
              clearInterval(intervalId);
            }
          }
        }
      } catch (error) {
        console.error("OCR 상태 확인 오류:", error);
        if (isMounted) {
          setStatus("failed");
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      }
    };

    // 초기 확인
    checkOCRStatus();

    // 주기적으로 확인
    intervalId = setInterval(checkOCRStatus, pollInterval);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [noteId, needsPolling, pollInterval]);

  return { status };
}
