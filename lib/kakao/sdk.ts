import type { KakaoStatic } from "@/types/kakao";

const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

let sdkPromise: Promise<KakaoStatic | null> | null = null;

/**
 * 카카오 앱 키가 설정되어 있는지 확인 (빌드 타임)
 */
export function isKakaoShareAvailable(): boolean {
  return !!process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
}

/**
 * 카카오 SDK를 lazy 로드하고 초기화 (싱글턴)
 * - 서버사이드 방어
 * - 중복 로드 방지
 * - 에러 시 null 반환
 */
export function loadKakaoSdk(): Promise<KakaoStatic | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<KakaoStatic | null>((resolve) => {
    // 이미 로드된 경우
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
        if (appKey) window.Kakao.init(appKey);
      }
      resolve(window.Kakao);
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;

    script.onload = () => {
      if (window.Kakao) {
        const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
        if (appKey && !window.Kakao.isInitialized()) {
          window.Kakao.init(appKey);
        }
        resolve(window.Kakao);
      } else {
        resolve(null);
      }
    };

    script.onerror = () => {
      console.error("[Kakao SDK] 스크립트 로드 실패");
      sdkPromise = null;
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}
