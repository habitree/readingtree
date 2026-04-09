import { ImageResponse } from "next/og";
import { OG_SIZE, FONT_FAMILY } from "@/lib/og/constants";
import { loadKoreanFont, loadBrandIcon, loadBrandIconFromUrl, buildFontOptions } from "@/lib/og/utils";
import {
  OgAccentBar,
  OgDomainFooter,
  OgAuroraBackground,
  OgGrainTexture,
  OgLeafDecoration,
} from "@/lib/og/components";
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
        <OgAccentBar colors={colors} />
        <OgAuroraBackground colors={colors} variant="home" />
        <OgGrainTexture />
        <OgLeafDecoration color={colors.forest} position="bottom-right" opacity={0.07} />

        {/* 메인 콘텐츠 */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: "0 80px",
          }}
        >
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: 28,
                boxShadow:
                  "0 16px 32px -8px rgba(26, 117, 85, 0.2), 0 0 60px rgba(26, 117, 85, 0.12), 0 0 0 1px rgba(26, 117, 85, 0.08)",
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
                boxShadow:
                  "0 16px 32px -8px rgba(26, 117, 85, 0.3), 0 0 60px rgba(26, 117, 85, 0.15)",
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

          <div
            style={{
              fontSize: 84,
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

          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: colors.forest,
              fontFamily: FONT_FAMILY,
              textAlign: "center",
              letterSpacing: "0.05em",
            }}
          >
            {brand.tagline}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 4,
            }}
          >
            <div
              style={{
                width: 40,
                height: 2,
                backgroundColor: colors.border,
                borderRadius: 1,
              }}
            />
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: colors.textSecondary,
                fontFamily: FONT_FAMILY,
                letterSpacing: "0.02em",
                opacity: 0.6,
              }}
            >
              {brand.keywords}
            </div>
            <div
              style={{
                width: 40,
                height: 2,
                backgroundColor: colors.border,
                borderRadius: 1,
              }}
            />
          </div>
        </div>

        <OgDomainFooter brand={brand} colors={colors} />
      </div>
    ),
    {
      ...size,
      ...buildFontOptions(fontData),
    }
  );
}
