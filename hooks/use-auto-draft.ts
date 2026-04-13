"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const DRAFT_PREFIX = "autodraft:";
const DEFAULT_DEBOUNCE_MS = 1000;
const DEFAULT_EXPIRY_DAYS = 7;
const NOTE_EXPIRY_DAYS = 14;

interface AutoDraftOptions<T> {
  /** 고유 키 (예: "note-new", "note-edit:abc123") */
  key: string;
  /** 현재 폼 데이터 */
  data: T;
  /** 비어있는 상태인지 판단하는 함수 — true면 저장하지 않음 */
  isEmpty: (data: T) => boolean;
  /** debounce 간격 (ms) */
  debounceMs?: number;
  /** 만료 일수 */
  expiryDays?: number;
  /** 비활성화 */
  enabled?: boolean;
}

interface StoredDraft<T> {
  data: T;
  savedAt: number; // timestamp
  expiryDays: number;
}

interface AutoDraftReturn<T> {
  /** 복원 가능한 임시저장이 있는지 */
  hasDraft: boolean;
  /** 저장된 draft 데이터 */
  draftData: T | null;
  /** draft 저장 시각 */
  savedAt: Date | null;
  /** draft 복원 (hasDraft 확인 후 호출) */
  restoreDraft: () => T | null;
  /** draft 삭제 */
  discardDraft: () => void;
  /** 정상 제출 시 호출 — draft 정리 */
  clearOnSubmit: () => void;
}

function getStorageKey(key: string): string {
  return `${DRAFT_PREFIX}${key}`;
}

function readDraft<T>(key: string): StoredDraft<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    if (!raw) return null;
    const stored: StoredDraft<T> = JSON.parse(raw);

    // 만료 체크
    const expiryMs = stored.expiryDays * 24 * 60 * 60 * 1000;
    if (Date.now() - stored.savedAt > expiryMs) {
      localStorage.removeItem(getStorageKey(key));
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(getStorageKey(key));
    return null;
  }
}

function writeDraft<T>(key: string, data: T, expiryDays: number): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredDraft<T> = {
      data,
      savedAt: Date.now(),
      expiryDays,
    };
    localStorage.setItem(getStorageKey(key), JSON.stringify(stored));
  } catch {
    // localStorage 용량 초과 시 가장 오래된 draft 삭제 후 재시도
    cleanOldestDraft();
    try {
      const stored: StoredDraft<T> = {
        data,
        savedAt: Date.now(),
        expiryDays,
      };
      localStorage.setItem(getStorageKey(key), JSON.stringify(stored));
    } catch {
      // 그래도 실패하면 무시
    }
  }
}

function removeDraft(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getStorageKey(key));
}

/** 가장 오래된 autodraft 항목 삭제 */
function cleanOldestDraft(): void {
  if (typeof window === "undefined") return;
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(DRAFT_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const stored = JSON.parse(raw) as StoredDraft<unknown>;
      if (stored.savedAt < oldestTime) {
        oldestTime = stored.savedAt;
        oldestKey = k;
      }
    } catch {
      // 파싱 실패 항목은 바로 삭제
      localStorage.removeItem(k);
      return;
    }
  }
  if (oldestKey) localStorage.removeItem(oldestKey);
}

/**
 * localStorage 기반 자동 임시저장 hook
 *
 * - debounce로 입력 중 자동 저장
 * - 마운트 시 기존 draft 감지 → 복원 제안
 * - 정상 제출 시 clearOnSubmit()으로 정리
 * - 만료된 draft 자동 무시
 */
export function useAutoDraft<T>({
  key,
  data,
  isEmpty,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  expiryDays,
  enabled = true,
}: AutoDraftOptions<T>): AutoDraftReturn<T> {
  const resolvedExpiry = expiryDays ?? (key.startsWith("note") ? NOTE_EXPIRY_DAYS : DEFAULT_EXPIRY_DAYS);

  // 마운트 시 한 번만 기존 draft 확인
  const [initialDraft] = useState<StoredDraft<T> | null>(() =>
    enabled ? readDraft<T>(key) : null
  );

  const [hasDraft, setHasDraft] = useState(!!initialDraft);
  const [draftData, setDraftData] = useState<T | null>(initialDraft?.data ?? null);
  const [savedAt, setSavedAt] = useState<Date | null>(
    initialDraft ? new Date(initialDraft.savedAt) : null
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearedRef = useRef(false);

  // debounce 자동 저장
  useEffect(() => {
    if (!enabled || clearedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (isEmpty(data)) return;
      writeDraft(key, data, resolvedExpiry);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key, data, isEmpty, debounceMs, resolvedExpiry, enabled]);

  const restoreDraft = useCallback((): T | null => {
    setHasDraft(false);
    return draftData;
  }, [draftData]);

  const discardDraft = useCallback(() => {
    removeDraft(key);
    setHasDraft(false);
    setDraftData(null);
    setSavedAt(null);
  }, [key]);

  const clearOnSubmit = useCallback(() => {
    clearedRef.current = true;
    removeDraft(key);
    setHasDraft(false);
    setDraftData(null);
    setSavedAt(null);
  }, [key]);

  return {
    hasDraft,
    draftData,
    savedAt,
    restoreDraft,
    discardDraft,
    clearOnSubmit,
  };
}

/** 만료된 모든 autodraft 정리 (앱 초기화 시 호출) */
export function cleanExpiredDrafts(): void {
  if (typeof window === "undefined") return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(DRAFT_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const stored = JSON.parse(raw) as StoredDraft<unknown>;
      const expiryMs = stored.expiryDays * 24 * 60 * 60 * 1000;
      if (Date.now() - stored.savedAt > expiryMs) {
        keysToRemove.push(k);
      }
    } catch {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}
