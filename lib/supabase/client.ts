import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 사이드에서 사용하는 Supabase 클라이언트
 * 브라우저 환경에서만 사용 가능
 * 
 * 빌드 타임에는 더미 클라이언트를 반환하여 빌드 오류를 방지합니다.
 * 런타임에는 환경 변수가 필수입니다.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 빌드 타임 체크: typeof window가 undefined이면 빌드 타임
  const isBuildTime = typeof window === "undefined";

  // 빌드 타임에는 더미 클라이언트 반환 (빌드 오류 방지)
  if (isBuildTime) {
    // 빌드 타임에는 실제 쿼리가 실행되지 않으므로 더미 값 사용
    return createBrowserClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key"
    );
  }

  // 런타임에는 환경 변수가 필수
  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missingVars.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    
    throw new Error(
      `❌ Supabase 환경 변수가 설정되지 않았습니다.\n` +
      `누락된 환경 변수: ${missingVars.join(", ")}\n` +
      `Vercel Dashboard에서 환경 변수를 설정하고 재배포하세요.\n` +
      `필요한 환경 변수:\n` +
      `- NEXT_PUBLIC_SUPABASE_URL\n` +
      `- NEXT_PUBLIC_SUPABASE_ANON_KEY`
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

