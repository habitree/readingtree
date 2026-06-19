import { createClient } from "@supabase/supabase-js";

/**
 * 폰트 시그니처 검증 — 손상/HTML(404) 파일을 Satori에 넘겨 렌더가 깨지는 것을 방지.
 * 유효: TTF(00010000) · OTF/OTTO(4F54544F) · 'true' · WOFF(wOFF) · WOFF2(wOF2)
 */
const FONT_SIGNATURES = new Set([0x00010000, 0x4f54544f, 0x74727565, 0x774f4646, 0x774f4632]);
function isValidFontBuffer(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  return FONT_SIGNATURES.has(new DataView(buf).getUint32(0, false));
}

/**
 * 한글 폰트 로드 (로컬 번들). 유효한 폰트 시그니처가 아니면 null.
 *
 * 주의: 현재 번들 폰트(public/fonts/NotoSansKR-SemiBold.otf)는 손상 상태(404 HTML)라
 * null 이 반환되며, 이 경우 ImageResponse 기본 폰트로 graceful 렌더된다(한글은 미표시 가능).
 * 유효한 한글 폰트 교체는 별도 작업으로 처리. 손상 데이터를 Satori에 넘기지 않아 크래시는 방지된다.
 */
export async function loadKoreanFont(
  localUrl: URL
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(localUrl);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (isValidFontBuffer(buf)) return buf;
    }
  } catch {
    // 무시 → null
  }
  return null;
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

/**
 * OG 이미지 생성용 service_role 클라이언트.
 * RLS를 우회해 공개 공유 리소스(예: 완독 카드)를 조회할 때 사용.
 * 서버 전용 (OG route handler)에서만 호출해야 한다.
 */
export function createOgAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
