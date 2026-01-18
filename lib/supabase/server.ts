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

  // 빌드 타임 체크: cookies() 호출이 실패하면 빌드 타임
  let isBuildTime = false;
  let cookieStore;
  
  try {
    cookieStore = await cookies();
  } catch {
    // cookies() 호출 실패 시 빌드 타임으로 간주
    isBuildTime = true;
  }

  // 빌드 타임에는 더미 클라이언트 반환 (빌드 오류 방지)
  if (isBuildTime) {
    return createServerClient(
      supabaseUrl || "https://placeholder.supabase.co",
      supabaseAnonKey || "placeholder-key",
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // 빌드 타임에는 쿠키 설정 무시
          },
        },
      }
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

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore!.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore!.set(name, value, options)
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

