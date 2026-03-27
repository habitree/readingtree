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
  const publicOnlyPaths = ["/about", "/terms", "/privacy", "/signup", "/verify-email", "/pricing", "/sample"];
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

  // getUser()는 세션 갱신 + 사용자 정보 조회를 동시에 처리
  // getSession()은 불필요 (getUser()가 세션 토큰 검증/갱신을 포함)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 게스트 접근 가능한 경로 (읽기 전용)
  const guestAccessiblePaths = ["/", "/books", "/bookshelves", "/notes", "/timeline", "/groups", "/search", "/persona", "/sample", "/chat", "/stats"];
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
    "/admin", // 관리자 페이지는 인증 필수
    // /chat은 게스트 접근 가능 (UI만 표시, 입력 시 로그인 유도)
    "/feature-requests/new", // 기능 요청 생성은 인증 필요
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

