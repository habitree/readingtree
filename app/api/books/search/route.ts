import { NextResponse } from "next/server";
import { searchBooks, transformNaverBookItem } from "@/lib/api/naver";
import { checkRateLimit } from "@/lib/middleware/rate-limit";

/**
 * 책 검색 API Route
 * 네이버 검색 API를 통해 책을 검색합니다.
 */
export async function GET(request: Request) {
  // Rate limiting 체크 (분당 60회 제한)
  const rateLimitResult = await checkRateLimit(request, 60);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    // 검색어 유효성 검사
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "검색어를 입력해주세요." },
        { status: 400 }
      );
    }

    // 검색어 최소 길이 검사 (너무 짧은 검색어 방지)
    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: "검색어는 최소 2자 이상 입력해주세요." },
        { status: 400 }
      );
    }

    // 검색어 최대 길이 검사 (너무 긴 검색어 방지)
    if (query.trim().length > 100) {
      return NextResponse.json(
        { error: "검색어는 100자 이하로 입력해주세요." },
        { status: 400 }
      );
    }

    // display와 start 파라미터 유효성 검사
    const display = Math.min(
      Math.max(parseInt(searchParams.get("display") || "10", 10), 1),
      100
    ); // 1-100 사이로 제한
    const start = Math.max(parseInt(searchParams.get("start") || "1", 10), 1); // 최소 1

    const response = await searchBooks({ query: query.trim(), display, start });

    // 네이버 API 응답 검증
    if (!response || !Array.isArray(response.items)) {
      throw new Error("네이버 API 응답 형식이 올바르지 않습니다.");
    }

    // 네이버 API 응답을 앱 내부 형식으로 변환
    const books = response.items.map(transformNaverBookItem);

    return NextResponse.json(
      {
        total: response.total,
        start: response.start,
        display: response.display,
        books,
      },
      {
        headers: {
          // 같은 검색어 5분 내 재요청은 Vercel Edge/CDN 캐시 히트 → 모바일 RTT 1회로 끝.
          // stale 600초 동안 백그라운드 갱신 허용.
          // 에러 응답에는 적용하지 않아 재시도 차단 방지(아래 catch 블록은 헤더 미설정).
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("책 검색 API 오류:", error);
    
    // 사용자 친화적인 에러 메시지로 변환
    let userFriendlyMessage = "책 검색에 실패했습니다.";
    let statusCode = 500;
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes("네이버 API 키")) {
        userFriendlyMessage = "검색 서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.";
        statusCode = 500;
      } else if (errorMessage.includes("네이버 API 호출 실패")) {
        userFriendlyMessage = "검색 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
        statusCode = 503;
      } else if (errorMessage.includes("응답 형식")) {
        userFriendlyMessage = "검색 결과를 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.";
        statusCode = 500;
      } else if (errorMessage.includes("네트워크") || errorMessage.includes("fetch")) {
        userFriendlyMessage = "인터넷 연결을 확인하고 다시 시도해주세요.";
        statusCode = 503;
      } else {
        // 기타 에러는 원본 메시지 사용 (이미 사용자 친화적일 수 있음)
        userFriendlyMessage = errorMessage;
      }
    }
    
    return NextResponse.json(
      {
        error: userFriendlyMessage,
      },
      { status: statusCode }
    );
  }
}

