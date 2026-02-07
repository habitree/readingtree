"use server";

import {
  createServerSupabaseClient,
  createAdminSupabaseClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAppUrl } from "@/lib/utils/url";

/**
 * 카카오톡 OAuth 로그인
 * Supabase Auth를 통해 카카오톡 로그인 URL 생성 및 리다이렉트
 * 
 * 규칙: 서버 중심 세션 관리
 * - OAuth 리다이렉트 후 /callback에서 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨123
 */
export async function signInWithKakao() {
  const supabase = await createServerSupabaseClient();

  // 프로덕션 URL 확실하게 가져오기
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/callback`;

  // 디버깅용 로그 (프로덕션에서만)
  if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
    console.log("[signInWithKakao] OAuth redirectTo:", {
      appUrl,
      redirectTo,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`카카오톡 로그인 실패: ${error.message}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * 구글 OAuth 로그인
 * Supabase Auth를 통해 구글 로그인 URL 생성 및 리다이렉트
 * 
 * 규칙: 서버 중심 세션 관리
 * - OAuth 리다이렉트 후 /callback에서 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨
 */
export async function signInWithGoogle() {
  const supabase = await createServerSupabaseClient();

  // 프로덕션 URL 확실하게 가져오기
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/callback`;

  // 디버깅용 로그 (프로덕션에서만)
  if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
    console.log("[signInWithGoogle] OAuth redirectTo:", {
      appUrl,
      redirectTo,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw new Error(`구글 로그인 실패: ${error.message}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * 이메일 로그인
 * Supabase Auth를 통해 이메일/비밀번호로 로그인
 * 
 * 규칙: 서버 중심 세션 관리
 * - 로그인 성공 시 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨
 * 
 * @param email 이메일 주소
 * @param password 비밀번호
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = await createServerSupabaseClient();

  // 유효성 검사
  if (!email || !email.includes("@")) {
    throw new Error("유효한 이메일 주소를 입력해주세요.");
  }

  if (!password || password.length < 1) {
    throw new Error("비밀번호를 입력해주세요.");
  }

  // 이메일/비밀번호로 로그인
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 에러 메시지 처리
    if (error.message.includes("Invalid login credentials") || error.message.includes("invalid")) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    if (error.message.includes("Email not confirmed")) {
      throw new Error("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
    }
    throw new Error(`로그인 실패: ${error.message}`);
  }

  // 로그인 성공 - 세션 생성됨
  // 사용자 프로필 확인 및 온보딩 상태 체크
  if (!data.user) {
    throw new Error("로그인에 실패했습니다. 다시 시도해주세요.");
  }

  // 사용자 프로필 확인
  let profile = null;
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries && !profile) {
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("reading_goal, terms_agreed, privacy_agreed")
      .eq("id", data.user.id)
      .single();

    if (!profileError && profileData) {
      profile = profileData;
      break;
    }

    if (retryCount < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    retryCount++;
  }

  // 프로필이 없으면 수동 생성 시도
  if (!profile) {
    const { error: insertError } = await supabase.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "사용자",
      avatar_url: data.user.user_metadata?.avatar_url || null,
      reading_goal: 12,
      terms_agreed: false,
      privacy_agreed: false,
    });

    if (!insertError) {
      profile = {
        reading_goal: 12,
        terms_agreed: false,
        privacy_agreed: false,
      };
      
      // 프로필 생성 후 관련 페이지 캐시 무효화
      revalidatePath("/");
      revalidatePath("/profile");
    }
  } else {
    // 프로필이 있는 경우에도 캐시 무효화
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/dashboard");
  }

  const appUrl = getAppUrl();

  // 약관 동의 여부 확인 (최우선)
  if (!profile || !profile.terms_agreed || !profile.privacy_agreed) {
    redirect(`${appUrl}/onboarding/consent`);
  }

  // 온보딩 완료 여부 확인
  if (!profile || !profile.reading_goal || profile.reading_goal === 0) {
    redirect(`${appUrl}/onboarding/goal`);
  }

  // 온보딩 완료 시 메인으로 리다이렉트
  redirect(`${appUrl}/`);
}

/**
 * 로그아웃
 * 
 * 규칙: 서버 중심 세션 관리
 * - 서버에서 세션 삭제 (쿠키도 자동 삭제됨)
 * - createServerSupabaseClient가 쿠키 삭제를 자동 처리
 */
export async function signOut() {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`로그아웃 실패: ${error.message}`);
  }

  // 세션 삭제 후 로그인 페이지로 리다이렉트
  // 쿠키 삭제는 createServerSupabaseClient가 자동 처리
  redirect("/login");
}

/**
 * 이메일 회원가입
 * Supabase Auth를 통해 이메일/비밀번호로 회원가입
 * 
 * 규칙: 서버 중심 세션 관리
 * - 회원가입 후 이메일 인증 링크가 자동으로 전송됨
 * - 이메일 인증 완료 후 /callback에서 세션이 생성됨 (쿠키 저장)
 * - 세션은 미들웨어에서 자동 갱신됨
 * 
 * @param email 이메일 주소
 * @param password 비밀번호 (최소 8자)
 * @param name 사용자 이름
 */
export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = await createServerSupabaseClient();

  // 유효성 검사
  if (!email || !email.includes("@")) {
    throw new Error("유효한 이메일 주소를 입력해주세요.");
  }

  if (!password || password.length < 8) {
    throw new Error("비밀번호는 최소 8자 이상이어야 합니다.");
  }

  if (!name || name.trim().length === 0 || name.length > 100) {
    throw new Error("이름은 1-100자 사이여야 합니다.");
  }

  // 프로덕션 URL 확실하게 가져오기
  const appUrl = getAppUrl();
  const redirectTo = `${appUrl}/callback`;

  // 회원가입 (이메일 인증 링크 자동 전송)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: {
        name: name.trim(),
      },
    },
  });

  if (error) {
    // 에러 메시지 처리
    if (error.message.includes("already registered") || error.message.includes("already exists")) {
      throw new Error("이미 가입된 이메일입니다. 로그인해주세요.");
    }
    if (error.message.includes("Password")) {
      throw new Error("비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.");
    }
    throw new Error(`회원가입 실패: ${error.message}`);
  }

  // 회원가입 성공 (이메일 인증 대기 중)
  return {
    success: true,
    message: "회원가입이 완료되었습니다. 이메일 인증 링크를 확인해주세요.",
    user: data.user,
  };
}

/**
 * 현재 사용자 정보 조회
 * 
 * 규칙: 서버 중심 세션 관리
 * - 쿠키 기반 세션에서 사용자 정보를 읽음
 * - 모든 페이지/컴포넌트에서 사용자 정보가 필요할 때 이 함수를 사용
 * - 클라이언트에서 직접 getUser() 호출 금지
 * 
 * @returns 사용자 정보 또는 null (로그인하지 않은 경우)
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // 에러가 발생하면 null 반환 (로그인하지 않은 것으로 처리)
  if (error) {
    return null;
  }

  return user;
}

/**
 * 관리자 권한 확인
 * 
 * 규칙: 서버 중심 세션 관리
 * - 현재 로그인한 사용자가 관리자인지 확인
 * - users 테이블의 is_admin 컬럼을 확인
 * 
 * @returns 관리자 여부 (true/false)
 */
export async function isAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return false;
  }

  return data.is_admin === true;
}

/**
 * 계정 삭제
 *
 * 주의: 이 작업은 되돌릴 수 없습니다.
 * - 사용자의 모든 데이터가 삭제됩니다 (CASCADE 설정에 따름)
 * - Auth 사용자 정보도 삭제됩니다
 *
 * @param confirmText 확인 문구 ("계정삭제"를 입력해야 함)
 */
export async function deleteAccount(confirmText: string) {
  // 확인 문구 검증
  if (confirmText !== "계정삭제") {
    throw new Error("확인 문구가 일치하지 않습니다.");
  }

  // 현재 사용자 확인
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }

  const userId = user.id;

  // Admin 클라이언트로 사용자 삭제 (service_role 필요)
  const adminSupabase = createAdminSupabaseClient();

  // 1. Auth 사용자 삭제 (관련 데이터는 CASCADE로 자동 삭제)
  const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(
    userId
  );

  if (deleteError) {
    console.error("계정 삭제 오류:", deleteError);
    throw new Error(`계정 삭제에 실패했습니다: ${deleteError.message}`);
  }

  // 2. 세션 정리 및 로그인 페이지로 리다이렉트
  redirect("/login?deleted=true");
}

