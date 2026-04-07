import { ImageResponse } from "next/og";
import { OG_SIZE, FONT_FAMILY } from "@/lib/og/constants";
import { loadKoreanFont, loadBrandIcon, loadBrandIconFromUrl, buildFontOptions } from "@/lib/og/utils";
import { OgAccentBar, OgDomainFooter } from "@/lib/og/components";
import { getOgConfig } from "@/lib/og/settings";

export const alt = "Habitree - 읽는 습관이 자라는 곳";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const [fontData, config] = await Promise.all([
    loadKoreanFont(
      new URL("../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    ),
    getOgConfig(),
  ]);

  const { brand, colors } = config;

  const iconSrc = config.brandIconUrl
    ? await loadBrandIconFromUrl(config.brandIconUrl)
    : await loadBrandIcon(new URL("./icon.png", import.meta.url));

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: colors.background,
          fontFamily: FONT_FAMILY,
        }}
      >
        {/* 상단 포레스트 악센트 바 */}
        <OgAccentBar colors={colors} />

        {/* 미묘한 텍스처 패턴 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(${colors.forest} 0.6px, transparent 0.6px)`,
            backgroundSize: "32px 32px",
            opacity: 0.025,
          }}
        />

        {/* 따뜻한 그라데이션 오버레이 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(29, 107, 77, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(94, 196, 150, 0.03) 0%, transparent 60%)`,
          }}
        />

        {/* 메인 콘텐츠 */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "0 80px",
          }}
        >
          {/* 로고 이미지 */}
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: 28,
                boxShadow:
                  "0 16px 32px -8px rgba(29, 107, 77, 0.2), 0 0 0 1px rgba(29, 107, 77, 0.08)",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                borderRadius: 28,
                backgroundColor: colors.forest,
                boxShadow: "0 16px 32px -8px rgba(29, 107, 77, 0.3)",
              }}
            >
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22v-7M9 22h6" />
                <path d="M17 7A5 5 0 0 0 7 7" />
                <path d="M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                <path d="M12 5V2" />
              </svg>
            </div>
          )}

          {/* 브랜드명 */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: colors.textPrimary,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontFamily: FONT_FAMILY,
              marginTop: 4,
            }}
          >
            {brand.name}
          </div>

          {/* 태그라인 */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: colors.forest,
              fontFamily: FONT_FAMILY,
              textAlign: "center",
            }}
          >
            {brand.tagline}
          </div>

          {/* 구분선 + 키워드 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 56,
                height: 2,
                backgroundColor: colors.border,
                borderRadius: 1,
              }}
            />
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: colors.textSecondary,
                fontFamily: FONT_FAMILY,
                letterSpacing: "0.01em",
              }}
            >
              {brand.keywords}
            </div>
            <div
              style={{
                width: 56,
                height: 2,
                backgroundColor: colors.border,
                borderRadius: 1,
              }}
            />
          </div>
        </div>

        {/* 하단 도메인 */}
        <OgDomainFooter brand={brand} colors={colors} />
      </div>
    ),
    {
      ...size,
      ...buildFontOptions(fontData),
    }
  );
}
