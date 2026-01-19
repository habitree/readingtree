import { createClient } from "@supabase/supabase-js";

/**
 * 서비스 역할 키를 사용하는 Supabase 클라이언트
 * RLS(Row Level Security)를 우회하여 모든 데이터에 접근 가능
 *
 * 주의: 관리자 기능에서만 사용해야 함
 * - 배치 처리
 * - 관리자 통계 조회
 * - 시스템 유지보수 작업
 */
export function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "관리자 Supabase 클라이언트 생성 실패: " +
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다."
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
