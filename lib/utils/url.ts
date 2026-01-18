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
  // 1. 수동 설정된 프로덕션 도메인 (최우선)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim();
    // localhost가 포함되어 있으면 무시하고 다음 단계로
    if (!url.includes("localhost")) {
      return url;
    }
  }

  // 2. VERCEL 환경 감지 (가장 확실한 방법)
  // Vercel 환경에서는 process.env.VERCEL이 자동으로 설정됨
  // VERCEL 환경에서는 절대 localhost를 반환하지 않음
  if (process.env.VERCEL) {
    // NEXT_PUBLIC_APP_URL이 localhost가 아니면 사용
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
      return process.env.NEXT_PUBLIC_APP_URL.trim();
    }
    
    // VERCEL_URL이 있으면 사용 (Preview든 Production이든)
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // VERCEL_ENV가 production이면 프로덕션 URL 사용
    if (process.env.VERCEL_ENV === "production") {
      return "https://readingtree.vercel.app";
    }
    
    // Preview 환경이어도 프로덕션 URL 사용 (OAuth 리다이렉트를 위해)
    return "https://readingtree.vercel.app";
  }

  // 3. VERCEL_ENV가 production이면 무조건 프로덕션 URL 사용 (이중 체크)
  if (process.env.VERCEL_ENV === "production") {
    return "https://readingtree.vercel.app";
  }

  // 4. 빌드 타임에 주입되는 Vercel URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    // localhost가 아니면 사용
    if (!vercelUrl.includes("localhost")) {
      return `https://${vercelUrl}`;
    }
  }

  // 5. 런타임 Vercel URL (서버 사이드에서만 사용 가능)
  if (process.env.VERCEL_URL) {
    const vercelUrl = process.env.VERCEL_URL;
    // localhost가 아니면 사용
    if (!vercelUrl.includes("localhost")) {
      return `https://${vercelUrl}`;
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
    return "http://localhost:3000";
  }
  
  // 그 외의 모든 경우 (Vercel 환경, 프로덕션 환경 등) 프로덕션 도메인 사용
  // 안전을 위해 localhost 대신 프로덕션 도메인을 기본값으로 사용
  // 이렇게 하면 Vercel 환경에서 환경 변수가 없어도 프로덕션 URL을 반환
  return "https://readingtree.vercel.app";
}

