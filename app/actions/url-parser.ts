"use server";

import type { SourceType } from "@/types/note";

export interface UrlMetadata {
  title: string;
  sourceType: SourceType;
  thumbnail?: string;
}

function detectSourceType(url: string): SourceType {
  try {
    const { hostname } = new URL(url);
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "youtube";
    if (hostname.includes("instagram.com")) return "instagram";
    return "article";
  } catch {
    return "other";
  }
}

/**
 * URL에서 메타데이터(제목, 출처 타입, 썸네일)를 추출한다.
 * YouTube: oEmbed API 사용 (인증 불필요)
 * Instagram: URL 패턴에서 핸들 추출
 * 아티클: HTML og:title / <title> 태그 파싱
 */
export async function parseUrlMetadata(url: string): Promise<UrlMetadata> {
  const sourceType = detectSourceType(url);

  if (sourceType === "youtube") {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = (await res.json()) as { title?: string; thumbnail_url?: string };
        return {
          title: data.title ?? url,
          sourceType: "youtube",
          thumbnail: data.thumbnail_url,
        };
      }
    } catch {
      // fallback
    }
    return { title: url, sourceType: "youtube" };
  }

  if (sourceType === "instagram") {
    try {
      const { pathname } = new URL(url);
      const segments = pathname.split("/").filter(Boolean);
      const label = segments.length > 0 ? `@${segments[0]}` : url;
      return { title: label, sourceType: "instagram" };
    } catch {
      return { title: url, sourceType: "instagram" };
    }
  }

  // 아티클 (기타 URL): og:title / <title> 파싱
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ReadTreeBot/1.0; +https://readtree.app)",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const html = await res.text();

      const ogTitle =
        html.match(
          /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"'<>]+)["']/i
        )?.[1] ??
        html.match(
          /<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']og:title["']/i
        )?.[1];

      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

      const ogImage =
        html.match(
          /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"'<>]+)["']/i
        )?.[1] ??
        html.match(
          /<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']og:image["']/i
        )?.[1];

      const title = (ogTitle ?? titleTag ?? url).trim();
      return { title, sourceType, thumbnail: ogImage };
    }
  } catch {
    // fallback
  }

  return { title: url, sourceType };
}
