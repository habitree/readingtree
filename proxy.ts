import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { CANONICAL_APP_URL, isLegacyProdHost } from "@/lib/utils/url";

/**
 * Next.js 16+: "middleware" 파일 규칙이 "proxy"로 변경됨.
 * 1) 구 프로덕션 도메인(readingtree-tan.vercel.app 등)으로 들어온 요청을
 *    정식 도메인(read.habitree.io)으로 308 영구 리다이렉트 (경로·쿼리 유지)
 *    — 과거에 공유된 링크·북마크·검색 유입을 새 도메인으로 수렴시킨다.
 * 2) 요청 전에 세션 갱신 등 실행 (Supabase 인증).
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (isLegacyProdHost(host)) {
    const target = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      CANONICAL_APP_URL,
    );
    return NextResponse.redirect(target, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
