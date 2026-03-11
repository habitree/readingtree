import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getAppUrl } from "@/lib/utils/url";
import { copySocialAvatarToStorage } from "@/lib/supabase/copy-social-avatar";
import { grantWelcomeBonus } from "@/app/actions/points";
import { processReferralOnSignup } from "@/app/actions/referral";
import { recordLoginLog } from "@/app/actions/admin/tracking";

/**
 * OAuth 및 이메일 인증 콜백 처리
 * Supabase Auth의 OAuth 인증 또는 이메일 인증 완료 후 호출되는 엔드포인트
 * 
 * 처리 순서:
 * 1. OAuth 코드 또는 이메일 인증 토큰을 세션으로 교환
 * 2. 사용자 프로필 자동 생성 확인 (TASK-00의 handle_new_user 트리거)
 * 3. 온보딩 상태 확인 및 리다이렉트
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token = requestUrl.searchParams.get("token");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/";

  // IP/User-Agent 추출
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  const supabase = await createServerSupabaseClient();

  try {
    // 이메일 인증 토큰 처리
    if (token && (type === "email" || type === "recovery" || type === "signup")) {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === "recovery" ? "recovery" : "email",
      });

      if (verifyError) {
        console.error("이메일 인증 오류:", {
          message: verifyError.message,
          status: verifyError.status,
          code: verifyError.code,
        });

        let errorMessage = "이메일 인증 처리 중 오류가 발생했습니다.";
        if (verifyError.message.includes("expired") || verifyError.message.includes("invalid")) {
          errorMessage = "인증 링크가 만료되었거나 유효하지 않습니다. 다시 시도해주세요.";
        }

        const baseUrl = getAppUrl();
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
        );
      }

      // 이메일 인증 성공, 세션 생성됨
      // 아래 프로필 확인 로직으로 진행
    }
    // OAuth 코드 처리
    else if (code) {
      // OAuth 코드를 세션으로 교환
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("OAuth 콜백 오류:", {
          message: exchangeError.message,
          status: exchangeError.status,
          code: exchangeError.code,
        });
        
        // 사용자 친화적인 에러 메시지
        let errorMessage = "로그인 처리 중 오류가 발생했습니다.";
        if (exchangeError.message.includes("expired") || exchangeError.message.includes("invalid")) {
          errorMessage = "로그인 세션이 만료되었습니다. 다시 시도해주세요.";
        } else if (exchangeError.message.includes("provider")) {
          errorMessage = "로그인 제공자 설정에 문제가 있습니다. 관리자에게 문의해주세요.";
        }
        
        // getAppUrl()을 사용하여 올바른 프로덕션 URL로 리다이렉트
        const baseUrl = getAppUrl();
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
        );
      }
    } else {
      // 코드도 토큰도 없으면 로그인 페이지로 리다이렉트
      const baseUrl = getAppUrl();
      return NextResponse.redirect(new URL("/login", baseUrl));
    }

    // 사용자 정보 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("사용자 정보를 가져올 수 없습니다:", {
        error: userError,
        hasUser: !!user,
      });
      // 로그인 실패 기록
      await recordLoginLog({
        ipAddress,
        userAgent,
        provider: "unknown",
        success: false,
        errorMessage: userError?.message ?? "사용자 정보 조회 실패",
      });
      // getAppUrl()을 사용하여 올바른 프로덕션 URL로 리다이렉트
      const baseUrl = getAppUrl();
      return NextResponse.redirect(
        new URL("/login?error=사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.", baseUrl)
      );
    }

    // OAuth 로그인 성공 기록 (await로 로그 완료 보장)
    const oauthProvider = user.app_metadata?.provider as string;
    await recordLoginLog({
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
      provider: (oauthProvider === "kakao" || oauthProvider === "google") ? oauthProvider : "unknown",
      success: true,
    });

    // 프로필 조회/생성에는 admin 클라이언트 사용 (RLS 우회, 세션 미확립 문제 방지)
    const adminClient = createAdminSupabaseClient();

    // 사용자 프로필 확인 (TASK-00의 handle_new_user 트리거가 자동 생성)
    // 트리거가 즉시 실행되지 않을 수 있으므로 재시도 로직 추가
    let profile = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !profile) {
      const { data, error: profileError } = await adminClient
        .from("users")
        .select("reading_goal, terms_agreed, privacy_agreed")
        .eq("id", user.id)
        .single();

      if (!profileError && data) {
        profile = data;
        break;
      }

      // 프로필이 없으면 잠시 대기 후 재시도 (트리거가 실행될 시간 확보)
      if (retryCount < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      retryCount++;
    }

    // 프로필이 여전히 없으면 수동 생성 시도 (admin 클라이언트로 RLS 우회)
    if (!profile) {
      // 소셜 프로필 이미지를 Supabase Storage에 복사 (URL 만료 방지)
      const rawAvatarUrl = user.user_metadata?.avatar_url || null;
      let avatarUrl: string | null = null;
      if (rawAvatarUrl) {
        avatarUrl = await copySocialAvatarToStorage(supabase, user.id, rawAvatarUrl);
      }
      const { error: insertError } = await adminClient.from("users").insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split("@")[0] || "사용자",
        avatar_url: avatarUrl,
        reading_goal: 12, // 기본값
        terms_agreed: false, // 약관 동의는 별도 페이지에서 처리
        privacy_agreed: false, // 약관 동의는 별도 페이지에서 처리
      });

      if (insertError) {
        console.error("프로필 생성 오류:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
        });
        // 프로필 생성이 실패한 경우 에러 페이지로 리다이렉트
        await recordLoginLog({
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          provider: (oauthProvider === "kakao" || oauthProvider === "google") ? oauthProvider : "unknown",
          success: false,
          errorMessage: `프로필 생성 실패: ${insertError.message}`,
        });
        const baseUrl = getAppUrl();
        return NextResponse.redirect(
          new URL("/login?error=계정 생성에 실패했습니다. 다시 시도해주세요.", baseUrl)
        );
      } else {
        // 프로필 생성 성공, 다시 조회
        const { data: newProfile } = await adminClient
          .from("users")
          .select("reading_goal, terms_agreed, privacy_agreed")
          .eq("id", user.id)
          .single();
        profile = newProfile;
      }
    }

    // 캐시 무효화
    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath("/dashboard");

    // 약관 동의 여부 확인 (최우선)
    // 약관 동의가 완료되지 않았으면 약관 동의 페이지로 리다이렉트
    if (!profile || !profile.terms_agreed || !profile.privacy_agreed) {
      const baseUrl = getAppUrl();
      return NextResponse.redirect(new URL("/onboarding/consent", baseUrl));
    }

    // 온보딩 완료 여부 확인
    // 목표가 설정되지 않았으면 온보딩으로 리다이렉트
    if (!profile || !profile.reading_goal || profile.reading_goal === 0) {
      // getAppUrl()을 사용하여 올바른 프로덕션 URL로 리다이렉트
      const baseUrl = getAppUrl();
      return NextResponse.redirect(new URL("/onboarding/goal", baseUrl));
    }

    // 온보딩 완료 시 웰컴 보너스 지급 (첫 가입 시 200P, 이미 지급된 경우 무시)
    await grantWelcomeBonus(user);

    // 레퍼럴 처리 (쿠키에서 추천인 정보 읽기)
    const referrerCookie = request.cookies.get("rt_ref")?.value;
    const sourceCookie = request.cookies.get("rt_ref_source")?.value;
    if (referrerCookie) {
      const [sourceType, sourceId] = (sourceCookie || "").split(":");
      await processReferralOnSignup(user, referrerCookie, sourceType, sourceId);
    }

    // 온보딩 완료 시 메인으로 리다이렉트 (캐시 무효화 후)
    // getAppUrl()을 사용하여 올바른 프로덕션 URL로 리다이렉트
    const baseUrl = getAppUrl();
    const redirectUrl = new URL(next, baseUrl);
    redirectUrl.searchParams.set("refreshed", "true"); // 클라이언트에서 새로고침 유도
    redirectUrl.searchParams.set("login", "success"); // 로그인 성공 표시
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘이므로 re-throw
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    console.error("OAuth 콜백 처리 중 예외 발생:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 사용자 친화적인 에러 메시지
    const errorMessage = error instanceof Error
      ? "로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요."
      : "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";

    // getAppUrl()을 사용하여 올바른 프로덕션 URL로 리다이렉트
    const baseUrl = getAppUrl();
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, baseUrl)
    );
  }
}

