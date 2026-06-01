import type { Metadata } from "next";
import { OG_BRAND, OG_TEXT_LIMITS, OG_SIZE } from "./constants";
import { getAppUrl } from "@/lib/utils/url";

export type ShareMetaKind = "note" | "stamp" | "bookshelf" | "completion" | "report" | "recap";

const KIND_LABEL: Record<ShareMetaKind, string> = {
  note: "독서 기록",
  stamp: "독서 스탬프",
  bookshelf: "서재",
  completion: "완독",
  report: "독서 리포트",
  recap: "월간 독서결산",
};

interface BuildShareMetadataInput {
  kind: ShareMetaKind;
  /** 공유 리소스 ID — 캐시 URL 분리용 */
  id: string;
  /** 공유 페이지 경로 (예: `/share/stamps/${id}`) */
  path: string;
  /** OG 카드 1줄 제목 원문 (책 제목·서재명 등). 25자 초과 시 자동 컷 */
  ogTitle: string;
  /** OG 카드 2줄 설명 원문 (인용·메모·통계 요약 등). 70자 초과 시 자동 컷 */
  ogDescription: string;
  /** 페이지 `<title>`. 미지정 시 `${ogTitle} | ReadTree` */
  pageTitle?: string;
  /** og:type — bookshelf만 website, 나머지는 article 권장 */
  ogType?: "article" | "website";
  /** og:image alt */
  alt?: string;
  /** OG 이미지 URL 명시 (미지정 시 path + /opengraph-image) */
  ogImageUrl?: string;
}

function trimToLimit(text: string, limit: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  return normalized.slice(0, Math.max(0, limit - 1)).trimEnd() + "…";
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

/**
 * 공유 페이지 generateMetadata 통합 빌더.
 *
 * - 25/70자 일괄 컷으로 카카오톡 표시 깨짐 방지
 * - `siteName = ReadTree`, title suffix 자동 부착
 * - twitter card 자동 미러
 * - OG 이미지 URL 자동 유도 (`${path}/opengraph-image`)
 */
export function buildShareMetadata(input: BuildShareMetadataInput): Metadata {
  const baseUrl = getAppUrl();
  const shareUrl = joinUrl(baseUrl, input.path);
  const ogImageUrl = input.ogImageUrl
    ?? joinUrl(baseUrl, `${input.path.replace(/\/+$/, "")}/opengraph-image`);

  const ogTitle = trimToLimit(input.ogTitle, OG_TEXT_LIMITS.metaTitle);
  const description = trimToLimit(input.ogDescription, OG_TEXT_LIMITS.metaDescription);
  const pageTitle = input.pageTitle ?? `${ogTitle} | ${OG_BRAND.name}`;
  const alt = input.alt ?? `${OG_BRAND.name} ${KIND_LABEL[input.kind]} 공유`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: ogTitle,
      description,
      type: input.ogType ?? (input.kind === "bookshelf" ? "website" : "article"),
      url: shareUrl,
      images: [
        {
          url: ogImageUrl,
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          alt,
        },
      ],
      siteName: OG_BRAND.name,
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

/** 공유 리소스를 찾을 수 없거나 비공개일 때 사용하는 fallback Metadata */
export function buildShareNotFoundMetadata(kind: ShareMetaKind): Metadata {
  const label = KIND_LABEL[kind];
  return {
    title: `${label}을(를) 찾을 수 없습니다 | ${OG_BRAND.name}`,
    description: `공유되지 않았거나 존재하지 않는 ${label}입니다.`,
  };
}
