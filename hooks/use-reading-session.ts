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
import { toast } from "sonner";
import { getActiveSession, setSessionPaused } from "@/app/actions/sessions";
import { computeActiveSeconds } from "@/lib/utils/session-time";
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

interface SharedFetchResult {
  value: ReadingLogActive | null;
  /** 요청이 나간 시각 — 일시정지 낙관값보다 오래된 응답인지 판별 */
  startedAt: number;
}

let inflightFetch: Promise<SharedFetchResult> | null = null;
let lastFetch: { at: number; result: SharedFetchResult } | null = null;

async function fetchActiveSessionShared(force = false): Promise<SharedFetchResult> {
  if (!force && lastFetch && Date.now() - lastFetch.at < DEDUPE_TTL_MS) {
    return lastFetch.result;
  }
  if (inflightFetch) return inflightFetch;
  const startedAt = Date.now();
  inflightFetch = getActiveSession()
    .then((value) => {
      const result = { value, startedAt };
      lastFetch = { at: Date.now(), result };
      return result;
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
  /**
   * 일시정지 낙관값 — 탭 즉시 모든 소비자(시트·FAB·사이드바·카드)에 반영.
   * confirmedAt 이후 시작된 서버 응답이 오면 제거된다.
   */
  pauseOverride: PauseOverride | null;
  isPauseToggling: boolean;
}

interface PauseOverride {
  sessionId: string;
  paused_at: string | null;
  paused_seconds: number;
  /** 서버 확정 시각 (null = 요청 중) */
  confirmedAt: number | null;
}

export const useReadingSessionStore = create<ReadingSessionState>((set) => ({
  optimisticSession: null,
  setOptimisticSession: (s) => set({ optimisticSession: s }),
  pendingClientSessionId: null,
  setPendingClientSessionId: (id) => set({ pendingClientSessionId: id }),
  pauseOverride: null,
  isPauseToggling: false,
}));

/** 세션에 일시정지 낙관값을 덮어쓴다 */
function applyPauseOverride(
  s: ReadingLogActive | null,
  override: PauseOverride | null,
): ReadingLogActive | null {
  if (!s || !override || override.sessionId !== s.id) return s;
  return { ...s, paused_at: override.paused_at, paused_seconds: override.paused_seconds };
}

/**
 * 일시정지 ↔ 재개 토글 (음악 플레이어식). 낙관 반영 → 서버 확정 → 다른 소비자/탭 동기화.
 */
export async function toggleSessionPause(
  session: Pick<ReadingLogActive, "id" | "paused_at" | "paused_seconds">,
): Promise<void> {
  const store = useReadingSessionStore;
  if (store.getState().isPauseToggling) return;

  const wantPaused = !session.paused_at;
  const now = Date.now();
  store.setState({
    isPauseToggling: true,
    pauseOverride: {
      sessionId: session.id,
      paused_at: wantPaused ? new Date(now).toISOString() : null,
      paused_seconds: wantPaused
        ? session.paused_seconds
        : session.paused_seconds +
          Math.max(0, Math.floor((now - new Date(session.paused_at as string).getTime()) / 1000)),
      confirmedAt: null,
    },
  });

  try {
    const result = await setSessionPaused(session.id, wantPaused);
    store.setState({
      pauseOverride: { sessionId: session.id, ...result, confirmedAt: Date.now() },
    });
    broadcastSessionUpdated(session.id);
  } catch (err) {
    store.setState({ pauseOverride: null });
    toast.error(err instanceof Error ? err.message : "일시정지 처리에 실패했어요.");
  } finally {
    store.setState({ isPauseToggling: false });
  }
}

/**
 * 폴링 없이 store 만 구독하는 경량 일시정지 컨트롤 (그리드 카드 등 다수 렌더 위치용).
 * 세션 데이터는 레이아웃 상주 useReadingSession 이 store 에 채운다.
 */
export function useSessionPauseControl() {
  const optimisticSession = useReadingSessionStore((s) => s.optimisticSession);
  const pauseOverride = useReadingSessionStore((s) => s.pauseOverride);
  const session = applyPauseOverride(optimisticSession, pauseOverride);
  const isPauseToggling = useReadingSessionStore((s) => s.isPauseToggling);
  const toggle = useCallback(() => {
    if (session) void toggleSessionPause(session);
  }, [session]);
  return {
    sessionId: session?.id ?? null,
    isPaused: !!session?.paused_at,
    isPauseToggling,
    toggle,
  };
}

// =============================================================================
// useReadingSession — 메인 훅
// =============================================================================

interface UseReadingSessionResult {
  session: ReadingLogActive | null;
  /** 일시정지 시간을 뺀 라이브 카운트 (일시정지 중엔 멈춤) */
  elapsedSeconds: number;
  isPaused: boolean;
  isPauseToggling: boolean;
  /** 일시정지 ↔ 재개 */
  togglePause: () => void;
  /** 다른 탭에 종료 알림 + 로컬 캐시 클리어 */
  broadcastEnd: (sessionId: string) => void;
  /** 강제 재조회 */
  refresh: () => Promise<void>;
  isLoading: boolean;
}

export function useReadingSession(): UseReadingSessionResult {
  const { optimisticSession, setOptimisticSession, pauseOverride, isPauseToggling } =
    useReadingSessionStore();
  const [serverSession, setServerSession] = useState<ReadingLogActive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSession = useCallback(
    async (force = false) => {
      try {
        const { value: s, startedAt } = await fetchActiveSessionShared(force);
        setServerSession(s);
        setOptimisticSession(s);
        // 서버 확정 이후에 나간 응답이면 낙관값을 걷어내고 서버 값을 따른다
        const override = useReadingSessionStore.getState().pauseOverride;
        if (override?.confirmedAt && startedAt >= override.confirmedAt) {
          useReadingSessionStore.setState({ pauseOverride: null });
        }
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
      } else if (msg?.type === "session-started" || msg?.type === "session-updated") {
        void fetchSession(true);
      }
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [fetchSession, setOptimisticSession]);

  const session = applyPauseOverride(serverSession ?? optimisticSession ?? null, pauseOverride);
  const elapsedSeconds = useElapsedSeconds(session);
  const togglePause = useCallback(() => {
    if (session) void toggleSessionPause(session);
  }, [session]);

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
    isPaused: !!session?.paused_at,
    isPauseToggling,
    togglePause,
    broadcastEnd,
    refresh,
    isLoading,
  };
}

// =============================================================================
// useElapsedSeconds — 일시정지 제외 라이브 카운트 (1초 tick, 일시정지 중엔 tick 중단)
// =============================================================================

function useElapsedSeconds(session: ReadingLogActive | null): number {
  // derived state: setInterval은 tick을 증가시켜 리렌더만 트리거,
  // 실제 elapsed는 매 렌더에서 세션 시각 기준으로 계산.
  const [, setTick] = useState(0);
  const startedAt = session?.started_at ?? null;
  const isPaused = !!session?.paused_at;

  useEffect(() => {
    if (!startedAt || isPaused) return;
    const id = setInterval(() => setTick((t) => (t + 1) & 0xffff), 1000);
    return () => clearInterval(id);
  }, [startedAt, isPaused]);

  return session ? computeActiveSeconds(session) : 0;
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

/** 일시정지/재개 등 진행 중 세션 값 변경 — 같은 탭의 다른 소비자에도 전달됨 */
export function broadcastSessionUpdated(sessionId: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ type: "session-updated", sessionId });
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
