import { NextRequest, NextResponse } from "next/server";

const ALLOWED_DOMAINS = [
  "supabase.co",
  "bookthumb-phinf.pstatic.net",
  "shopping-phinf.pstatic.net",
  "image.aladin.co.kr",
  "kakaocdn.net",
  "lh3.googleusercontent.com",
  "covers.openlibrary.org",
  "cover.nl.go.kr",
  "phinf.pstatic.net",
];

function isDomainAllowed(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  if (!isDomainAllowed(url)) {
    return new NextResponse("Domain not allowed", { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "ReadingTree/1.0" },
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", {
        status: response.status,
      });
    }

    const contentType =
      response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=2678400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse("Image proxy error", { status: 502 });
  }
}
