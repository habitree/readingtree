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
import { OgBrandMark, OgFallbackContent } from "@/lib/og/components";
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
            backgroundImage:
              "radial-gradient(circle at 0% 0%, rgba(180, 140, 80, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(29, 107, 77, 0.06) 0%, transparent 50%)",
          }}
        >
          {/* 상단 어스 톤 바 */}
          <div
            style={{
              width: "100%",
              height: 4,
              background: `linear-gradient(90deg, ${colors.earth}, ${colors.earthLight}, ${colors.forest})`,
            }}
          />

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
              {/* 좌측: 책 표지 + 제목 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "36px 32px",
                  backgroundColor: "#faf5ee",
                  width: 320,
                  gap: 20,
                }}
              >
                {coverDataUri ? (
                  <img
                    src={coverDataUri}
                    alt=""
                    width={160}
                    height={240}
                    style={{
                      objectFit: "cover",
                      borderRadius: 8,
                      boxShadow:
                        "0 12px 28px -8px rgba(0, 0, 0, 0.25), 0 4px 8px -2px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 160,
                      height: 240,
                      backgroundColor: "#e2e0dc",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15,
                      color: "#8c7e6e",
                      fontWeight: 600,
                      fontFamily: FONT_FAMILY,
                      boxShadow: "0 8px 20px -6px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    표지 없음
                  </div>
                )}
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
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  {/* AI 리포트 라벨 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${colors.earth}, ${colors.earthLight})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                      >
                        <path d="M12 3l1.5 4.5H18l-3.5 2.5L16 14.5 12 12l-4 2.5 1.5-4.5L6 7.5h4.5z" />
                      </svg>
                    </div>
                    <span
                      style={{
                        fontSize: 22,
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
                        width: 4,
                        borderRadius: 2,
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
