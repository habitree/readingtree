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

  // 빌드 타임이나 환경 변수가 없을 때 더미 클라이언트 반환
  // 빌드 타임에는 실제 쿼리가 실행되지 않으므로 안전합니다.
  if (!supabaseUrl || !supabaseAnonKey) {
    const dummyUrl = supabaseUrl || "https://dummy.supabase.co";
    const dummyKey = supabaseAnonKey || "dummy-key";
    return createBrowserClient(dummyUrl, dummyKey);
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

