import { OG_COLORS, OG_BRAND, FONT_FAMILY } from "./constants";
import type { OgConfig } from "@/types/og-settings";

type OgColors = OgConfig["colors"];
type OgBrand = OgConfig["brand"];

/** 상단 포레스트 악센트 바 */
export function OgAccentBar({ colors }: { colors?: OgColors } = {}) {
  const c = colors ?? OG_COLORS;
  return (
    <div
      style={{
        width: "100%",
        height: 5,
        background: `linear-gradient(90deg, ${c.forest}, ${c.forestLight}, ${c.forestLighter}, ${c.forestLight}, ${c.forest})`,
      }}
    />
  );
}

/** 하단 도메인 푸터 */
export function OgDomainFooter({
  brand,
  colors,
}: { brand?: OgBrand; colors?: OgColors } = {}) {
  const b = brand ?? OG_BRAND;
  const c = colors ?? OG_COLORS;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingBottom: 32,
      }}
    >
      <div
        style={{
          fontSize: 18,
          color: c.textMuted,
          fontWeight: 500,
          fontFamily: FONT_FAMILY,
        }}
      >
        {b.domain}
      </div>
    </div>
  );
}

/** 브랜드 마크 (아이콘 + 텍스트) — 카드 내부 */
export function OgBrandMark({
  iconSrc,
  size = "sm",
  brand,
  colors,
}: {
  iconSrc: string | null;
  size?: "sm" | "md";
  brand?: OgBrand;
  colors?: OgColors;
}) {
  const b = brand ?? OG_BRAND;
  const c = colors ?? OG_COLORS;
  const iconSize = size === "md" ? 28 : 24;
  const fontSize = size === "md" ? 15 : 14;
  const borderRadius = size === "md" ? 7 : 6;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {iconSrc ? (
        <img
          src={iconSrc}
          alt=""
          width={iconSize}
          height={iconSize}
          style={{ borderRadius }}
        />
      ) : (
        <div
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius,
            background: `linear-gradient(135deg, ${c.forest}, ${c.forestLight})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={Math.round(iconSize * 0.55)}
            height={Math.round(iconSize * 0.55)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
          </svg>
        </div>
      )}
      <span
        style={{
          fontSize,
          fontWeight: 800,
          color: c.textPrimary,
          fontFamily: FONT_FAMILY,
        }}
      >
        {b.name}
      </span>
    </div>
  );
}

/** 폴백 콘텐츠 (데이터 없을 때) */
export function OgFallbackContent({
  message,
  iconSrc,
  brand,
  colors,
}: {
  message: string;
  iconSrc?: string | null;
  brand?: OgBrand;
  colors?: OgColors;
}) {
  const b = brand ?? OG_BRAND;
  const c = colors ?? OG_COLORS;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.background,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          padding: 48,
          backgroundColor: c.cardBackground,
          borderRadius: 24,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            width={80}
            height={80}
            style={{ borderRadius: 20, marginBottom: 24 }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: c.forest,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
            </svg>
          </div>
        )}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: c.textPrimary,
            fontFamily: FONT_FAMILY,
          }}
        >
          {b.name}
        </div>
        <div
          style={{
            fontSize: 16,
            color: c.textSecondary,
            marginTop: 8,
            fontFamily: FONT_FAMILY,
          }}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
