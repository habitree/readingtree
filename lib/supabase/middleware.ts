import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 미들웨어에서 사용하는 Supabase 클라이언트
 * 인증 상태 확인 및 세션 갱신에 사용
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 환경 변수가 없으면 기본 응답 반환 (개발 환경)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return supabaseResponse;
  }

  // 순수 공개 페이지는 세션 갱신/인증 확인 불필요 → 조기 반환
  const publicOnlyPaths = ["/about", "/terms", "/privacy", "/signup", "/verify-email"];
  const isPublicOnly = publicOnlyPaths.some((path) =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + "/")
  );
  if (isPublicOnly) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 (명시적 처리)
  // getSession()과 getUser()를 호출하면 @supabase/ssr가 자동으로 세션을 갱신합니다
  // 쿠키 업데이트는 createServerClient의 setAll 콜백을 통해 자동 처리됩니다
  // session 변수는 사용하지 않지만, 호출 자체가 세션 갱신을 트리거합니다
  await supabase.auth.getSession();
  
  // 사용자 정보 조회 (세션 갱신 후)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 게스트 접근 가능한 경로 (읽기 전용)
  const guestAccessiblePaths = ["/", "/books", "/notes", "/timeline", "/groups", "/search", "/persona", "/sample"];
  const isGuestAccessiblePath = guestAccessiblePaths.some((path) => {
    // 루트 경로는 정확히 일치해야 함
    if (path === "/") {
      return request.nextUrl.pathname === "/";
    }
    return request.nextUrl.pathname.startsWith(path);
  });

  // 엄격히 보호되는 경로 (인증 필수 - 작성/수정 관련)
  const strictProtectedPaths = [
    "/profile",
    "/notes/new",
    "/books/search", // 책 검색 및 추가는 인증 필요
    "/groups/new", // 모임 생성은 인증 필요
  ];
  const isStrictProtectedPath = strictProtectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 인증 페이지 경로 (로그인, 온보딩)
  const authPaths = ["/login", "/onboarding"];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 엄격히 보호되는 경로는 인증 필수
  if (isStrictProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // 게스트 접근 가능한 경로는 인증 없이도 접근 허용 (리다이렉트하지 않음)

  // 이미 로그인한 사용자가 로그인 페이지 접근 시 홈으로 리다이렉트
  if (request.nextUrl.pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // 온보딩 페이지는 인증된 사용자만 접근 가능
  if (isAuthPath && request.nextUrl.pathname.startsWith("/onboarding") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

