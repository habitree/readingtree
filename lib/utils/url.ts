/**
 * 애플리케이션 기본 URL 가져오기
 * 프로덕션 URL을 우선적으로 처리하고, Preview URL과 구분합니다.
 *
 * 우선순위:
 * 1. NEXT_PUBLIC_APP_URL (수동 설정된 프로덕션 도메인 - 최우선, 단 레거시 도메인은 무시)
 * 2. VERCEL 환경 감지 (VERCEL 환경 변수 존재 여부)
 *    - production: 항상 정식 도메인(CANONICAL_APP_URL) — VERCEL_URL은 배포별
 *      생성 URL이라 공유 링크/OAuth 리다이렉트에 부적합
 *    - preview: VERCEL_URL (프리뷰 자체 URL)
 * 3. NEXT_PUBLIC_VERCEL_URL / VERCEL_URL (Vercel 감지 실패 시 보조)
 * 4. 로컬 개발: localhost, 그 외: 정식 도메인
 */

/** 정식 프로덕션 도메인 (2026-07-12: read.habitree.io 로 이전) */
export const CANONICAL_APP_URL = "https://read.habitree.io";

/**
 * 과거 프로덕션 도메인 목록.
 * - getAppUrl(): NEXT_PUBLIC_APP_URL 이 여기 남아 있으면 무시하고 정식 도메인 사용
 *   (Vercel 환경변수 갱신 누락에 대한 안전망)
 * - proxy.ts: 이 도메인으로 들어온 요청을 정식 도메인으로 308 리다이렉트
 */
const LEGACY_PROD_HOSTS = ["readingtree-tan.vercel.app"];

/** 요청 host 가 과거 프로덕션 도메인인지 (포트 무시) */
export function isLegacyProdHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.toLowerCase().split(":")[0];
  return LEGACY_PROD_HOSTS.includes(bare);
}

/** URL 문자열이 과거 프로덕션 도메인을 가리키는지 */
function isLegacyUrl(url: string): boolean {
  try {
    return isLegacyProdHost(new URL(url).host);
  } catch {
    return false;
  }
}

export function getAppUrl(): string {
  return _getAppUrl().replace(/\/+$/, "");
}

function _getAppUrl(): string {
  // 1. 수동 설정된 프로덕션 도메인 (최우선)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    if (isLegacyUrl(url)) {
      // 환경변수가 구 도메인으로 남아 있는 경우 — 무시하고 정식 도메인 사용
      if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
        console.warn(
          "[getAppUrl] NEXT_PUBLIC_APP_URL이 레거시 도메인입니다. 정식 도메인으로 대체:",
          url,
          "→",
          CANONICAL_APP_URL,
        );
      }
      return CANONICAL_APP_URL;
    }
    // localhost가 포함되어 있으면 무시하고 다음 단계로
    if (!url.includes("localhost") && url.startsWith("https://")) {
      return url;
    }
    // localhost이거나 http인 경우 경고
    if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
      console.warn("[getAppUrl] NEXT_PUBLIC_APP_URL이 localhost이거나 http입니다:", url);
    }
  }

  // 1.5 브라우저 프로덕션 번들 안전망:
  // 클라이언트에는 VERCEL/VERCEL_ENV가 노출되지 않으므로 NEXT_PUBLIC_APP_URL이
  // 비어 있으면 배포별 URL(NEXT_PUBLIC_VERCEL_URL)로 빠질 수 있다 → 정식 도메인 고정
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return CANONICAL_APP_URL;
  }

  // 2. VERCEL 환경 감지 (가장 확실한 방법)
  // VERCEL 환경에서는 절대 localhost를 반환하지 않음
  if (process.env.VERCEL) {
    // production 배포는 항상 정식 도메인 사용.
    // (VERCEL_URL은 `<deployment>.vercel.app` 형태의 배포별 생성 URL이라
    //  공유 링크·OAuth 리다이렉트 대상으로 부적합)
    if (process.env.VERCEL_ENV === "production") {
      return CANONICAL_APP_URL;
    }

    // Preview 는 자체 배포 URL 사용
    if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL.trim();
      if (!vercelUrl.includes("localhost")) {
        return `https://${vercelUrl}`;
      }
    }

    return CANONICAL_APP_URL;
  }

  // 3. VERCEL_ENV가 production이면 무조건 정식 도메인 (이중 체크)
  if (process.env.VERCEL_ENV === "production") {
    return CANONICAL_APP_URL;
  }

  // 4. 빌드 타임에 주입되는 Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL.trim();
    if (!vercelUrl.includes("localhost")) {
      return `https://${vercelUrl}`;
    }
  }

  // 5. 런타임 Vercel URL (서버 사이드에서만 사용 가능)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.trim();
    if (!vercelUrl.includes("localhost")) {
      return `https://${vercelUrl}`;
    }
  }

  // 6. 기본값 — 명확한 로컬 개발 환경에서만 localhost 사용
  const isLocalDev =
    process.env.NODE_ENV === "development" &&
    !process.env.VERCEL &&
    !process.env.VERCEL_URL &&
    !process.env.NEXT_PUBLIC_VERCEL_URL;

  if (isLocalDev) {
    return "http://localhost:3000";
  }

  // 그 외의 모든 경우 (Vercel 환경, 프로덕션 환경 등) 정식 도메인 사용
  return CANONICAL_APP_URL;
}
