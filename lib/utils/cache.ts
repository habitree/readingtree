/**
 * 간단한 메모리 기반 캐시 유틸리티
 * 클라이언트 사이드에서 사용할 수 있는 캐싱 기능
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live (밀리초)
}

class SimpleCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * 캐시에 데이터 저장
   * @param key 캐시 키
   * @param data 저장할 데이터
   * @param ttl 캐시 유지 시간 (밀리초, 기본 5분)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * 캐시에서 데이터 조회
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // TTL 확인
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 캐시 항목을 메타데이터(timestamp, ttl)와 함께 조회.
   * SWR 패턴(즉시 표시 + 백그라운드 갱신) 구현 시 stale 여부 판정에 사용.
   */
  getEntry<T>(key: string): { data: T; timestamp: number; ttl: number } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry as CacheEntry<T>;
  }

  /**
   * 캐시 삭제
   * @param key 캐시 키
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 모든 캐시 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 항목 정리
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// 싱글톤 인스턴스
export const cache = new SimpleCache();

// 주기적으로 만료된 캐시 정리 (5분마다)
if (typeof window !== "undefined") {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

