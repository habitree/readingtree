/**
 * Rate Limiting 미들웨어 (Supabase 기반)
 *
 * 설계 결정 (2026-04-20):
 *   Vercel Functions(Seoul icn1) + Supabase(Seoul ap-northeast-2) 인프라 특성상
 *   동일 region Supabase가 Upstash Redis Tokyo보다 3~4배 빠르다(5-10ms vs 30-40ms).
 *   추가 인프라 불필요, 비용 0, RLS·백업 통합.
 *   자세한 근거는 memory/feedback_redis_free_tier.md 참조.
 *
 * 저장소:
 *   public.rate_limits 테이블 + rate_limit_check RPC (atomic UPSERT)
 *
 * Fallback:
 *   Supabase 장애 시 메모리 기반으로 fail-open (서비스 차단 방지)
 */

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// ─── 메모리 fallback ────────────────────────────────────────────────────────
const memoryStore: RateLimitStore = {};

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    Object.keys(memoryStore).forEach((key) => {
      if (memoryStore[key].resetTime < now) {
        delete memoryStore[key];
      }
    });
  }, 60_000);
}

function memoryCheck(
  token: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining?: number; resetTime?: number } {
  const now = Date.now();
  const entry = memoryStore[token];

  if (!entry || entry.resetTime < now) {
    memoryStore[token] = { count: 1, resetTime: now + windowMs };
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count += 1;
  return {
    success: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime,
  };
}

// ─── 기존 API 호환 (legacy) ─────────────────────────────────────────────────
interface RateLimitOptions {
  interval: number;
  uniqueTokenPerInterval: number;
}

export function rateLimit(options: RateLimitOptions) {
  const { interval } = options;
  return {
    check: (limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const result = memoryCheck(token, limit, interval);
        if (result.success) resolve();
        else reject(new Error("Rate limit exceeded"));
      }),
  };
}

export const defaultRateLimiter = rateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
});

// ─── 토큰 생성 ─────────────────────────────────────────────────────────────
function extractIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

function extractRoute(request: Request): string {
  try {
    return new URL(request.url).pathname;
  } catch {
    return "unknown";
  }
}

// ─── 메인 진입점 ───────────────────────────────────────────────────────────
/**
 * IP + route 기반 rate limiting.
 * 시그니처 호환: checkRateLimit(request, limit=60)
 *
 * @returns { success, remaining?, resetTime? }
 */
export async function checkRateLimit(
  request: Request,
  limit: number = 60
): Promise<{ success: boolean; remaining?: number; resetTime?: number }> {
  const ip = extractIp(request);
  const route = extractRoute(request);
  const token = `${ip}:${route}`;
  const windowSeconds = 60;

  // 1차: Supabase RPC (원자적, 분산 정확)
  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await supabase.rpc("rate_limit_check", {
      p_token: token,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) throw error;

    const result = data as {
      success: boolean;
      remaining: number;
      reset_at: string;
      count: number;
    };

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: new Date(result.reset_at).getTime(),
    };
  } catch (err) {
    // fail-open: Supabase 장애 시 메모리 fallback
    // TODO(Wave 4): captureError(err, { source: 'rate-limit', token })
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[rate-limit] Supabase RPC 실패 - 메모리 fallback:",
        err instanceof Error ? err.message : err
      );
    }
    return memoryCheck(token, limit, windowSeconds * 1000);
  }
}
