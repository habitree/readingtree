import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
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

/**
 * 관리자 권한이 필요한 작업을 위한 Supabase Admin 클라이언트
 * service_role 키를 사용하여 RLS를 우회
 *
 * 주의: 서버 사이드에서만 사용해야 함 (클라이언트에 노출 금지)
 * 사용 사례: 사용자 계정 삭제, 관리자 전용 데이터 작업
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Admin 클라이언트 생성 실패: SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

