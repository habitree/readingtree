"use client";

/**
 * 진행 중 세션 라이브 훅 (기록 기능 전면 개편 Phase 2)
 *
 * - getActiveSession 폴링 (30초) + visibilitychange 시 강제 revalidate
 * - BroadcastChannel("readtree-session") — 다중 탭 동기화
 * - 시간 카운트는 started_at 기준 클라이언트 계산 (1초 tick)
 *
 * 사용처: ActiveSessionIndicator(Phase 4), RecordSheet(Phase 3).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { getActiveSession } from "@/app/actions/sessions";
import type { ReadingLogActive } from "@/types/progress";

const CHANNEL_NAME = "readtree-session";
const POLL_INTERVAL_MS = 30_000;
const DEDUPE_TTL_MS = 10_000;

// =============================================================================
// getActiveSession 공유 fetch — 훅 인스턴스 간 디둡
//
// 사이드바·모바일 내비·인디케이터 등 레이아웃 상주 소비자가 각자 마운트/폴링해도
// 같은 시점의 요청은 서버로 1회만 나간다. (in-flight 공유 + 짧은 TTL 캐시)
// 세션 시작/종료 브로드캐스트·수동 refresh는 force로 TTL을 무시해 즉시 신선한 값을 가져온다.
// =============================================================================

let inflightFetch: Promise<ReadingLogActive | null> | null = null;
let lastFetch: { at: number; value: ReadingLogActive | null } | null = null;

async function fetchActiveSessionShared(force = false): Promise<ReadingLogActive | null> {
  if (!force && lastFetch && Date.now() - lastFetch.at < DEDUPE_TTL_MS) {
    return lastFetch.value;
  }
  if (inflightFetch) return inflightFetch;
  inflightFetch = getActiveSession()
    .then((value) => {
      lastFetch = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inflightFetch = null;
    });
  return inflightFetch;
}

// =============================================================================
// Zustand store — optimistic 캐시 (다른 탭 메시지·취소·종료 직후 즉시 반영)
// =============================================================================

interface ReadingSessionState {
  optimisticSession: ReadingLogActive | null;
  setOptimisticSession: (s: ReadingLogActive | null) => void;
  /** 시작 직전 생성한 멱등키 — 충돌 시 동일 키로 멱등 호출 */
  pendingClientSessionId: string | null;
  setPendingClientSessionId: (id: string | null) => void;
}

export const useReadingSessionStore = create<ReadingSessionState>((set) => ({
  optimisticSession: null,
  setOptimisticSession: (s) => set({ optimisticSession: s }),
  pendingClientSessionId: null,
  setPendingClientSessionId: (id) => set({ pendingClientSessionId: id }),
}));

// =============================================================================
// useReadingSession — 메인 훅
// =============================================================================

interface UseReadingSessionResult {
  session: ReadingLogActive | null;
  /** started_at 기준 라이브 카운트 */
  elapsedSeconds: number;
  /** 다른 탭에 종료 알림 + 로컬 캐시 클리어 */
  broadcastEnd: (sessionId: string) => void;
  /** 강제 재조회 */
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export function useReadingSession(): UseReadingSessionResult {
  const { optimisticSession, setOptimisticSession } = useReadingSessionStore();
  const [serverSession, setServerSession] = useState<ReadingLogActive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSession = useCallback(
    async (force = false) => {
      try {
        const s = await fetchActiveSessionShared(force);
        setServerSession(s);
        setOptimisticSession(s);
      } catch {
        // 실패 시 기존 값 유지
      } finally {
        setIsLoading(false);
      }
    },
    [setOptimisticSession],
  );

  // 마운트 + 폴링
  useEffect(() => {
    void fetchSession();
    intervalRef.current = setInterval(() => {
      void fetchSession();
    }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchSession]);

  // visibilitychange — 탭 복귀 시 즉시 revalidate
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchSession]);

  // BroadcastChannel — 다중 탭 동기
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent) => {
      const msg = event.data as { type?: string; sessionId?: string };
      if (msg?.type === "session-ended" || msg?.type === "session-cancelled") {
        setOptimisticSession(null);
        setServerSession(null);
        void fetchSession(true);
      } else if (msg?.type === "session-started") {
        void fetchSession(true);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [fetchSession, setOptimisticSession]);

  const session = serverSession ?? optimisticSession ?? null;
  const elapsedSeconds = useElapsedSeconds(session?.started_at ?? null);

  const broadcastEnd = useCallback(
    (sessionId: string) => {
      setOptimisticSession(null);
      setServerSession(null);
      channelRef.current?.postMessage({ type: "session-ended", sessionId });
      void fetchSession(true);
    },
    [fetchSession, setOptimisticSession],
  );

  const refresh = useCallback(() => fetchSession(true), [fetchSession]);

  return {
    session,
    elapsedSeconds,
    broadcastEnd,
    refresh,
    isLoading,
  };
}

// =============================================================================
// useElapsedSeconds — started_at 기준 라이브 카운트 (1초 tick)
// =============================================================================

function useElapsedSeconds(startedAt: string | null): number {
  // derived state: setInterval은 tick을 증가시켜 리렌더만 트리거,
  // 실제 elapsed는 매 렌더에서 startedAt 기준으로 계산.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setTick((t) => (t + 1) & 0xffff), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return computeElapsed(startedAt);
}

function computeElapsed(startedAt: string | null): number {
  if (!startedAt) return 0;
  const startedMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
}

// =============================================================================
// Broadcast helpers — Phase 3 RecordSheet에서 호출
// =============================================================================

export function broadcastSessionStarted(sessionId: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "session-started", sessionId });
  channel.close();
}

export function broadcastSessionEnded(sessionId: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "session-ended", sessionId });
  channel.close();
}

export function broadcastSessionCancelled(sessionId: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "session-cancelled", sessionId });
  channel.close();
}

/** UUID v4 생성 (멱등키용) */
export function generateClientSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
