"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UIStyleKey } from "@/types/style";
import { STYLE_KEYS } from "@/types/style";

/**
 * 독서 목표 설정
 * @param goal 1-100 사이의 숫자
 */
export async function setReadingGoal(goal: number) {
  // 유효성 검사
  if (goal < 1 || goal > 100) {
    throw new Error("독서 목표는 1-100 사이의 숫자여야 합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // Users 테이블 업데이트
  const { error } = await supabase
    .from("users")
    .update({ reading_goal: goal })
    .eq("id", user.id);

  if (error) {
    throw new Error(`목표 설정 실패: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * 온보딩 완료 처리
 * 로컬 스토리지에 저장하는 것은 클라이언트 사이드에서 처리
 * 서버에서는 사용자 프로필이 생성되었는지 확인
 */
export async function checkOnboardingComplete() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isComplete: false, needsGoal: true };
  }

  // Users 테이블에서 사용자 프로필 확인
  const { data: profile, error } = await supabase
    .from("users")
    .select("reading_goal")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { isComplete: false, needsGoal: true };
  }

  // 목표가 설정되어 있으면 온보딩 완료로 간주
  return {
    isComplete: profile.reading_goal !== null && profile.reading_goal > 0,
    needsGoal: !profile.reading_goal || profile.reading_goal === 0,
  };
}

/**
 * 약관 동의 저장
 * @param termsAgreed 이용약관 동의 여부
 * @param privacyAgreed 개인정보처리방침 동의 여부
 */
export async function agreeToTerms(termsAgreed: boolean, privacyAgreed: boolean) {
  // 유효성 검사
  if (!termsAgreed || !privacyAgreed) {
    throw new Error("이용약관과 개인정보처리방침에 모두 동의해야 합니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // Users 테이블 업데이트
  const { error } = await supabase
    .from("users")
    .update({
      terms_agreed: termsAgreed,
      privacy_agreed: privacyAgreed,
      consent_date: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(`약관 동의 저장 실패: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * 약관 동의 여부 확인
 */
export async function checkConsentComplete() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { isComplete: false, needsConsent: true };
  }

  // Users 테이블에서 약관 동의 여부 확인
  const { data: profile, error } = await supabase
    .from("users")
    .select("terms_agreed, privacy_agreed")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return { isComplete: false, needsConsent: true };
  }

  // 약관 동의가 완료되었는지 확인
  const isComplete = profile.terms_agreed === true && profile.privacy_agreed === true;

  return {
    isComplete,
    needsConsent: !isComplete,
  };
}

/**
 * UI 스타일 설정
 * @param style UI 스타일 키 (minimal, warm, professional, poetic)
 */
export async function setUIStyle(style: UIStyleKey) {
  // 유효성 검사
  if (!STYLE_KEYS.includes(style)) {
    throw new Error("유효하지 않은 스타일입니다.");
  }

  const supabase = await createServerSupabaseClient();

  // 현재 사용자 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // Users 테이블 업데이트
  const { error } = await supabase
    .from("users")
    .update({ ui_style: style })
    .eq("id", user.id);

  if (error) {
    throw new Error(`스타일 설정 실패: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * 사용자의 UI 스타일 조회
 */
export async function getUserUIStyle(): Promise<UIStyleKey> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return "minimal"; // 기본값
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("ui_style")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return "minimal"; // 기본값
  }

  // 유효한 스타일인지 확인
  const style = profile.ui_style as UIStyleKey;
  if (STYLE_KEYS.includes(style)) {
    return style;
  }

  return "minimal"; // 기본값
}

