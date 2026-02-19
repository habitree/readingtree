"use client";

import { signInWithKakao, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

/**
 * 소셜 로그인 버튼 컴포넌트
 * 카카오톡, 구글 로그인 버튼 제공
 */
export function SocialLoginButtons() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<"kakao" | "google" | null>(null);

  const handleKakaoLogin = async () => {
    try {
      setIsLoading("kakao");
      await signInWithKakao();
      // redirect()가 성공하면 여기까지 도달하지 않음
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
    } catch (error: unknown) {
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
      // 이 예외는 무시하고 리다이렉트를 기다림
      // Next.js의 redirect()는 특별한 타입의 예외를 던지므로
      // 에러 메시지나 타입으로 확인
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        // 리다이렉트가 진행 중이므로 로딩 상태 유지
        // 에러를 표시하지 않음
        return;
      }

      // 실제 에러인 경우에만 처리
      console.error("카카오톡 로그인 오류:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "카카오톡 로그인에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading("google");
      await signInWithGoogle();
      // redirect()가 성공하면 여기까지 도달하지 않음
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
    } catch (error: unknown) {
      // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘
      // 이 예외는 무시하고 리다이렉트를 기다림
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        // 리다이렉트가 진행 중이므로 로딩 상태 유지
        // 에러를 표시하지 않음
        return;
      }

      // 실제 에러인 경우에만 처리
      console.error("구글 로그인 오류:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : "구글 로그인에 실패했습니다. 다시 시도해주세요."
      );
    }
  };

  // 카카오 아이콘 SVG
  const KakaoIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mr-2"
    >
      <path
        d="M9 0C4.03 0 0 3.27 0 7.3c0 2.55 1.7 4.8 4.25 6.05L3.5 17.5l4.5-2.45c.5.05 1 .1 1.5.1 4.97 0 9-3.27 9-7.3S13.97 0 9 0z"
        fill="#000000"
      />
    </svg>
  );

  // 구글 아이콘 SVG
  const GoogleIcon = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mr-2"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.186l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.705c-.18-.54-.282-1.117-.282-1.705s.102-1.165.282-1.705V4.963H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.037l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );

  return (
    <div className="space-y-3">
      {/* 카카오 로그인 - 전용 variant 사용 */}
      <Button
        type="button"
        onClick={handleKakaoLogin}
        disabled={isLoading !== null}
        variant="kakao"
        size="lg"
        fullWidth
      >
        {isLoading === "kakao" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("socialLogin.loggingIn")}
          </>
        ) : (
          <>
            <KakaoIcon />
            {t("socialLogin.startWithKakao")}
          </>
        )}
      </Button>

      {/* 구글 로그인 - 전용 variant 사용 */}
      <Button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading !== null}
        variant="google"
        size="lg"
        fullWidth
      >
        {isLoading === "google" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("socialLogin.loggingIn")}
          </>
        ) : (
          <>
            <GoogleIcon />
            {t("socialLogin.startWithGoogle")}
          </>
        )}
      </Button>
    </div>
  );
}
