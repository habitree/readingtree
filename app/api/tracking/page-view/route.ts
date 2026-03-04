import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recordAccessLog } from "@/app/actions/admin/tracking";

// Rate limit: 분당 30회 (IP 기준)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = request.headers.get("user-agent") ?? null;

    if (!checkRateLimit(ipAddress)) {
      return NextResponse.json({ error: "rate limited" }, { status: 429 });
    }

    const body = await request.json();
    const { path, sessionId, referer } = body as {
      path?: string;
      sessionId?: string;
      referer?: string;
    };

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "invalid path" }, { status: 400 });
    }

    // 로그인 사용자 확인
    let userId: string | null = null;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // 미로그인 사용자
    }

    recordAccessLog({
      userId,
      sessionId: sessionId ?? null,
      ipAddress,
      userAgent,
      path,
      referer: referer ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
