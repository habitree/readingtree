import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import {
  OG_SIZE,
  OG_TEXT_LIMITS,
  FONT_FAMILY,
} from "@/lib/og/constants";
import {
  loadKoreanFont,
  loadBrandIcon,
  loadBrandIconFromUrl,
  prefetchImageAsDataUri,
  truncateText,
  buildFontOptions,
  createOgAnonSupabaseClient,
} from "@/lib/og/utils";
import {
  OgBrandMark,
  OgFallbackContent,
  OgEarthAccentBar,
  OgAuroraBackground,
  OgGrainTexture,
  OgSparkleIcon,
  OgLeafDecoration,
  OgDotPattern,
  OgBookCoverFrame,
  OgSparkleScatter,
} from "@/lib/og/components";
import { getOgConfig } from "@/lib/og/settings";

export const alt = "Habitree AI 독서 리포트";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [fontData, config] = await Promise.all([
    loadKoreanFont(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    ),
    getOgConfig(),
  ]);
  const fontOptions = buildFontOptions(fontData);
  const { brand, colors } = config;

  const brandIconSrc = config.brandIconUrl
    ? await loadBrandIconFromUrl(config.brandIconUrl)
    : await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  try {
    const { id: shareId } = await params;

    if (!shareId || typeof shareId !== "string" || !isValidUUID(shareId)) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const supabase = createOgAnonSupabaseClient();
    const { data: report, error } = await supabase
      .from("ai_generated_reports")
      .select("book_title, book_author, cover_image_url, note_count, report_markdown")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .single();

    if (!report || error) {
      return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
    }

    const bookTitle = truncateText(
      report.book_title || "제목 없음",
      OG_TEXT_LIMITS.bookTitle
    );
    const bookAuthor = report.book_author || "저자 미상";

    // 리포트에서 첫 번째 인사이트 추출
    const insightMatch = report.report_markdown?.match(
      /##\s*(?:핵심|인사이트|key|insight)[^\n]*\n([\s\S]*?)(?=\n##|$)/i
    );
    let insightPreview = insightMatch
      ? insightMatch[1].replace(/[#*\->\n]/g, " ").trim()
      : "";
    if (insightPreview.length > OG_TEXT_LIMITS.insightPreview) {
      insightPreview = insightPreview.slice(0, OG_TEXT_LIMITS.insightPreview - 3) + "...";
    }
    if (!insightPreview) {
      insightPreview = `기록 ${report.note_count}개를 분석한 AI 독서 리포트`;
    }

    const coverDataUri = report.cover_image_url
      ? await prefetchImageAsDataUri(report.cover_image_url)
      : null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: FONT_FAMILY,
            backgroundColor: colors.background,
          }}
        >
          {/* 상단 어스 톤 바 (8px + 글로우) */}
          <OgEarthAccentBar colors={colors} />

          {/* 오로라 배경 (earth+forest 혼합) */}
          <OgAuroraBackground colors={colors} variant="report" />
          <OgGrainTexture />

          {/* 장식 나뭇잎 */}
          <OgLeafDecoration color={colors.earthLight} position="bottom-right" opacity={0.07} leafSize="md" />

          {/* 메인 영역 */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "30px 60px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: 480,
                backgroundColor: colors.cardBackground,
                borderRadius: 20,
                boxShadow:
                  "0 20px 60px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                overflow: "hidden",
              }}
            >
              {/* 좌측: 책 표지 + 제목 (warm 오로라) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "36px 32px",
                  background: `linear-gradient(160deg, rgba(196, 147, 90, 0.08) 0%, rgba(224, 180, 122, 0.05) 50%, rgba(250, 245, 238, 0.9) 100%), linear-gradient(180deg, #faf5ee 0%, #fdf9f3 100%)`,
                  width: 320,
                  gap: 20,
                }}
              >
                <OgBookCoverFrame coverSrc={coverDataUri} width={160} height={240} accentColor={colors.earth} />
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.3,
                    textAlign: "center",
                    fontFamily: FONT_FAMILY,
                    maxWidth: 260,
                  }}
                >
                  {bookTitle}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#64748b",
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {bookAuthor}
                </div>
              </div>

              {/* 우측: AI 리포트 미리보기 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "40px 44px",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <OgDotPattern color="rgba(196,147,90,0.08)" opacity={0.02} />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {/* AI 리포트 라벨 (스파클 아이콘) */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${colors.earth}, ${colors.earthLight})`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 4px 12px rgba(196, 147, 90, 0.2)`,
                        }}
                      >
                        <OgSparkleIcon size={18} color="white" />
                      </div>
                      <OgSparkleScatter color={colors.earthLight} opacity={0.2} />
                    </div>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: "#44403c",
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      AI 독서 리포트
                    </span>
                  </div>

                  {/* 기록 수 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 14,
                      color: "#78716c",
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    기록 {report.note_count}개 기반 AI 분석
                  </div>

                  {/* 인사이트 미리보기 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        borderRadius: 3,
                        backgroundColor: colors.earthLight,
                        marginRight: 20,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 20,
                        lineHeight: 1.7,
                        color: "#44403c",
                        fontFamily: FONT_FAMILY,
                        fontWeight: 600,
                      }}
                    >
                      {insightPreview}
                    </div>
                  </div>
                </div>

                {/* 구분선 */}
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    backgroundColor: "#e5e7eb",
                    marginBottom: 20,
                  }}
                />

                {/* 브랜딩 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <OgBrandMark iconSrc={brandIconSrc} size="md" brand={brand} colors={colors} />
                </div>
              </div>
            </div>
          </div>

          {/* 하단 도메인 */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingBottom: 16,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: colors.textMuted,
                fontWeight: 500,
                fontFamily: FONT_FAMILY,
                letterSpacing: "0.08em",
              }}
            >
              {brand.domain}
            </span>
          </div>
        </div>
      ),
      { ...size, ...fontOptions }
    );
  } catch (e) {
    console.error("[OG Image] Unexpected error:", e);
    return fallbackImageResponse(fontOptions, brandIconSrc, brand, colors);
  }
}

function fallbackImageResponse(
  fontOptions: Record<string, unknown> = {},
  iconSrc?: string | null,
  brand?: { name: string; tagline: string; keywords: string; domain: string; description: string },
  colors?: Record<string, string>
) {
  return new ImageResponse(
    <OgFallbackContent
      message="이 리포트를 찾을 수 없거나 비공개입니다."
      iconSrc={iconSrc}
      brand={brand}
      colors={colors as never}
    />,
    { ...size, ...fontOptions }
  );
}
