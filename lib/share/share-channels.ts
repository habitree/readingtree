import { loadKakaoSdk, isKakaoShareAvailable } from "@/lib/kakao/sdk";

/**
 * 공유 채널 모듈.
 *
 * 완독 카드·노트·리포트·책장 등 모든 공유 진입점이 이 모듈을 사용한다.
 * Phase 3A의 simple-share-dialog.tsx에서 검증된 카카오 공유 패턴을 재사용.
 */

export type ShareKind = "note" | "report" | "completion" | "bookshelf";

export type ShareContext = {
  kind: ShareKind;
  /** 원본 리소스 ID (userBookId | noteId | reportShareId | bookshelfId) */
  id: string;
  title: string;
  description: string;
  /** 공유 링크 대상 경로 (예: `/share/completions/{id}`) */
  path: string;
  /** OG 이미지의 절대 URL. 지정하지 않으면 path + /opengraph-image 로 유추 */
  ogImageUrl?: string;
  /** 버튼 CTA 텍스트 (기본: "자세히 보기") */
  ctaLabel?: string;
};

/**
 * 공유 URL을 만든다. 사용자 ID가 주어지면 `?ref={id}&src={kind}` 파라미터를 부착.
 */
export function buildShareUrl(
  baseUrl: string,
  context: ShareContext,
  referrerUserId?: string | null,
): string {
  const url = new URL(context.path, baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
  if (referrerUserId) {
    url.searchParams.set("ref", referrerUserId);
    url.searchParams.set("src", context.kind);
  }
  return url.toString();
}

function resolveOgImageUrl(baseUrl: string, context: ShareContext): string {
  if (context.ogImageUrl) return context.ogImageUrl;
  const url = new URL(
    context.path.replace(/\/$/, "") + "/opengraph-image",
    baseUrl.endsWith("/") ? baseUrl : baseUrl + "/",
  );
  return url.toString();
}

/**
 * 링크 복사. Clipboard API 실패 시 fallback.
 * @returns 성공 여부
 */
export async function copyShareLink(shareUrl: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = shareUrl;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * 카카오톡 공유. 프로덕션 도메인이 Kakao Developers에 등록되어 있어야 한다.
 * @returns 성공 여부 (SDK 로드 실패 또는 키 미설정 시 false)
 */
export async function shareViaKakao(params: {
  baseUrl: string;
  context: ShareContext;
  referrerUserId?: string | null;
}): Promise<boolean> {
  if (!isKakaoShareAvailable()) return false;

  const kakao = await loadKakaoSdk();
  if (!kakao) return false;

  const shareUrl = buildShareUrl(params.baseUrl, params.context, params.referrerUserId);
  const ogImageUrl = resolveOgImageUrl(params.baseUrl, params.context);
  const description = truncateForKakao(params.context.description);

  kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: params.context.title,
      description,
      imageUrl: ogImageUrl,
      imageWidth: 1200,
      imageHeight: 630,
      link: {
        mobileWebUrl: shareUrl,
        webUrl: shareUrl,
      },
    },
    buttons: [
      {
        title: params.context.ctaLabel ?? "자세히 보기",
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
    ],
  });

  return true;
}

/**
 * X (Twitter) intent URL을 새 창으로 연다. 항상 성공한다고 가정.
 */
export function shareViaX(params: {
  baseUrl: string;
  context: ShareContext;
  referrerUserId?: string | null;
}): boolean {
  if (typeof window === "undefined") return false;

  const shareUrl = buildShareUrl(params.baseUrl, params.context, params.referrerUserId);
  const text = `${params.context.title} | ${truncateForX(params.context.description)}`;
  const intentUrl = new URL("https://x.com/intent/tweet");
  intentUrl.searchParams.set("text", text);
  intentUrl.searchParams.set("url", shareUrl);

  window.open(intentUrl.toString(), "_blank", "noopener,noreferrer,width=600,height=500");
  return true;
}

/**
 * 디바이스의 Web Share API 지원 여부. 모바일 권장 fallback.
 */
export function isNativeShareAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export async function shareViaNative(params: {
  baseUrl: string;
  context: ShareContext;
  referrerUserId?: string | null;
}): Promise<boolean> {
  if (!isNativeShareAvailable()) return false;

  const shareUrl = buildShareUrl(params.baseUrl, params.context, params.referrerUserId);

  try {
    await navigator.share({
      title: params.context.title,
      text: params.context.description,
      url: shareUrl,
    });
    return true;
  } catch (error) {
    // 사용자가 취소하거나 에러가 난 경우
    if (error instanceof Error && error.name === "AbortError") return false;
    return false;
  }
}

function truncateForKakao(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 100 ? normalized.slice(0, 97) + "..." : normalized;
}

function truncateForX(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 100 ? normalized.slice(0, 97) + "..." : normalized;
}

export { isKakaoShareAvailable };
