/**
 * 애플리케이션 기본 URL 가져오기
 * 프로덕션 URL을 우선적으로 처리하고, Preview URL과 구분합니다.
 * 
 * 우선순위:
 * 1. NEXT_PUBLIC_APP_URL (수동 설정된 프로덕션 도메인 - 최우선)
 * 2. VERCEL 환경 감지 (VERCEL 환경 변수 존재 여부)
 * 3. VERCEL_ENV가 production인 경우 프로덕션 URL 사용
 * 4. NEXT_PUBLIC_VERCEL_URL (빌드 타임에 Vercel이 자동 주입, 프로덕션 도메인인 경우)
 * 5. VERCEL_URL (런타임에 Vercel이 제공, 프로덕션 도메인인 경우)
 * 6. 기본값 (개발/프로덕션)
 */
export function getAppUrl(): string {
  // 강화된 디버깅 로그 (프로덕션에서만)
  if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
    console.log("[getAppUrl] 환경 변수 확인:", {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
      NODE_ENV: process.env.NODE_ENV,
    });
  }

  // 1. 수동 설정된 프로덕션 도메인 (최우선)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    // localhost가 포함되어 있으면 무시하고 다음 단계로
    if (!url.includes("localhost") && url.startsWith("https://")) {
      if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
        console.log("[getAppUrl] NEXT_PUBLIC_APP_URL 사용:", url);
      }
      return url;
    }
    // localhost이거나 http인 경우 경고
    if (process.env.VERCEL || process.env.VERCEL_ENV === "production") {
      console.warn("[getAppUrl] NEXT_PUBLIC_APP_URL이 localhost이거나 http입니다:", url);
    }
  }

  // 2. VERCEL 환경 감지 (가장 확실한 방법)
  // Vercel 환경에서는 process.env.VERCEL이 자동으로 설정됨
  // VERCEL 환경에서는 절대 localhost를 반환하지 않음
  if (process.env.VERCEL) {
    // NEXT_PUBLIC_APP_URL이 localhost가 아니고 https이면 사용
    if (process.env.NEXT_PUBLIC_APP_URL) {
      const url = process.env.NEXT_PUBLIC_APP_URL.trim();
      if (!url.includes("localhost") && url.startsWith("https://")) {
        console.log("[getAppUrl] VERCEL 환경에서 NEXT_PUBLIC_APP_URL 사용:", url);
        return url;
      }
    }
    
    // VERCEL_URL이 있으면 사용 (Preview든 Production이든)
    if (process.env.VERCEL_URL) {
      const vercelUrl = process.env.VERCEL_URL.trim();
      if (!vercelUrl.includes("localhost")) {
        const url = `https://${vercelUrl}`;
        console.log("[getAppUrl] VERCEL 환경에서 VERCEL_URL 사용:", url);
        return url;
      }
    }
    
    // VERCEL_ENV가 production이면 프로덕션 URL 사용
    if (process.env.VERCEL_ENV === "production") {
      console.log("[getAppUrl] VERCEL_ENV=production, 프로덕션 URL 사용");
      return "https://readingtree.vercel.app";
    }
    
    // Preview 환경이어도 프로덕션 URL 사용 (OAuth 리다이렉트를 위해)
    console.log("[getAppUrl] VERCEL 환경 (Preview), 프로덕션 URL 사용");
    return "https://readingtree.vercel.app";
  }

  // 3. VERCEL_ENV가 production이면 무조건 프로덕션 URL 사용 (이중 체크)
  if (process.env.VERCEL_ENV === "production") {
    console.log("[getAppUrl] VERCEL_ENV=production (이중 체크), 프로덕션 URL 사용");
    return "https://readingtree.vercel.app";
  }

  // 4. 빌드 타임에 주입되는 Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL.trim();
    // localhost가 아니면 사용
    if (!vercelUrl.includes("localhost")) {
      const url = `https://${vercelUrl}`;
      console.log("[getAppUrl] NEXT_PUBLIC_VERCEL_URL 사용:", url);
      return url;
    }
  }

  // 5. 런타임 Vercel URL (서버 사이드에서만 사용 가능)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL.trim();
    // localhost가 아니면 사용
    if (!vercelUrl.includes("localhost")) {
      const url = `https://${vercelUrl}`;
      console.log("[getAppUrl] VERCEL_URL 사용:", url);
      return url;
    }
  }

  // 6. 기본값
  // 로컬 개발 환경에서만 localhost 사용
  // 명확하게 로컬 개발 환경인지 확인
  // VERCEL 환경 변수가 없고, NODE_ENV가 development인 경우에만 localhost 사용
  const isLocalDev = 
    process.env.NODE_ENV === "development" && 
    !process.env.VERCEL && 
    !process.env.VERCEL_URL &&
    !process.env.NEXT_PUBLIC_VERCEL_URL;
  
  if (isLocalDev) {
    console.log("[getAppUrl] 로컬 개발 환경, localhost 사용");
    return "http://localhost:3000";
  }
  
  // 그 외의 모든 경우 (Vercel 환경, 프로덕션 환경 등) 프로덕션 도메인 사용
  // 안전을 위해 localhost 대신 프로덕션 도메인을 기본값으로 사용
  // 이렇게 하면 Vercel 환경에서 환경 변수가 없어도 프로덕션 URL을 반환
  console.log("[getAppUrl] 기본값 사용 (프로덕션 URL)");
  return "https://readingtree.vercel.app";
}

