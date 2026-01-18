import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 사이드에서 사용하는 Supabase 클라이언트
 * Server Components, Server Actions, API Routes에서 사용
 * 
 * 빌드 타임에는 더미 클라이언트를 반환하여 빌드 오류를 방지합니다.
 * 런타임에는 환경 변수가 필수입니다.
 */
export async function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 빌드 타임이나 환경 변수가 없을 때 더미 클라이언트 반환
  // 빌드 타임에는 실제 쿼리가 실행되지 않으므로 안전합니다.
  if (!supabaseUrl || !supabaseAnonKey) {
    const dummyUrl = supabaseUrl || "https://dummy.supabase.co";
    const dummyKey = supabaseAnonKey || "dummy-key";
    
    // 빌드 타임에는 cookies() 호출이 실패할 수 있으므로 try-catch 처리
    try {
      const cookieStore = await cookies();
      return createServerClient(dummyUrl, dummyKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // 빌드 타임에는 쿠키 설정 무시
          },
        },
      });
    } catch {
      // cookies() 호출 실패 시 (빌드 타임) 더미 클라이언트 반환
      return createServerClient(dummyUrl, dummyKey, {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // 빌드 타임에는 쿠키 설정 무시
          },
        },
      });
    }
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

