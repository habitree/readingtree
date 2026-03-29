import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let cachedClient: ReturnType<typeof createSupabaseClient> | null = null;

/**
 * 음악 전용 Supabase 클라이언트 (읽기 전용, 인증 불필요)
 * 별도 Supabase 프로젝트에 연결 — 로그인 없이 anon key로만 접근
 */
export function createMusicClient() {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_MUSIC_ANON_KEY;

  const isBuildTime = typeof window === "undefined";

  if (isBuildTime) {
    return createSupabaseClient(
      url || "https://placeholder.supabase.co",
      anonKey || "placeholder-key",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  if (!url || !anonKey) {
    const missingVars = [];
    if (!url) missingVars.push("NEXT_PUBLIC_SUPABASE_MUSIC_URL");
    if (!anonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_MUSIC_ANON_KEY");

    throw new Error(
      `Music Supabase 환경 변수 누락: ${missingVars.join(", ")}\n` +
        `Vercel Dashboard 또는 .env.local에 설정해주세요.`
    );
  }

  cachedClient = createSupabaseClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}
