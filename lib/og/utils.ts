import { createClient } from "@supabase/supabase-js";
import { FONT_FAMILY } from "./constants";

/** 한글 폰트 로드 (로컬 파일 우선, 실패 시 외부 fetch) */
export async function loadKoreanFont(
  localUrl: URL
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(localUrl);
    if (res.ok) return res.arrayBuffer();
  } catch {
    // 로컬 실패 시 CDN fallback
  }
  try {
    const res = await fetch(
      "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-SemiBold.otf"
    );
    if (!res.ok) throw new Error("Failed to fetch font");
    return res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * 외부 이미지를 사전 fetch하여 base64 data URI로 변환
 * Satori 스트림 렌더링 중 외부 fetch 실패로 인한 500 에러 방지
 */
export async function prefetchImageAsDataUri(
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Habitree/1.0)" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/** icon.png를 base64 data URI로 로드 */
export async function loadBrandIcon(
  iconUrl: URL
): Promise<string | null> {
  try {
    const res = await fetch(iconUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

/** 텍스트 잘라내기 (말줄임 추가) */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/** 텍스트 정리: 줄바꿈 → 공백, trim */
export function cleanText(text: string): string {
  return text.replace(/\n+/g, " ").trim();
}

/** 폰트 데이터로 Satori fonts 옵션 생성 */
export function buildFontOptions(
  fontData: ArrayBuffer | null
): Record<string, unknown> {
  if (!fontData) return {};
  return {
    fonts: [
      {
        name: "NotoSansKR",
        data: fontData,
        style: "normal" as const,
        weight: 600 as const,
      },
    ],
  };
}

/** 공개 데이터 조회용 익명 Supabase 클라이언트 */
export function createOgAnonSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** 원격 URL에서 브랜드 아이콘을 base64 data URI로 로드 (Supabase Storage용) */
export async function loadBrandIconFromUrl(
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Habitree/1.0)" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 2 * 1024 * 1024) return null; // 2MB 제한
    const contentType = res.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/** RLS 우회 Supabase 클라이언트 (user 정보 조회용) */
export function createOgServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
