import { OG_COLORS, OG_BRAND, FONT_FAMILY } from "./constants";
import type { OgConfig } from "@/types/og-settings";

type OgColors = OgConfig["colors"];
type OgBrand = OgConfig["brand"];

/** 오로라 배경 — 다중 radial-gradient 오버레이 (강화) */
export function OgAuroraBackground({
  colors,
  variant = "home",
}: {
  colors?: OgColors;
  variant?: "home" | "note" | "bookshelf" | "report";
}) {
  const c = colors ?? OG_COLORS;

  const gradientsByVariant = {
    home: `radial-gradient(ellipse 120% 80% at 15% 20%, rgba(26, 117, 85, 0.14) 0%, transparent 60%), radial-gradient(ellipse 100% 90% at 85% 75%, rgba(61, 184, 127, 0.12) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 50% 10%, rgba(125, 217, 168, 0.08) 0%, transparent 50%), radial-gradient(ellipse 90% 50% at 50% 100%, rgba(196, 147, 90, 0.05) 0%, transparent 50%)`,
    note: `radial-gradient(ellipse 100% 80% at 10% 30%, rgba(26, 117, 85, 0.12) 0%, transparent 55%), radial-gradient(ellipse 90% 70% at 90% 70%, rgba(61, 184, 127, 0.09) 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 50% 90%, rgba(125, 217, 168, 0.05) 0%, transparent 45%)`,
    bookshelf: `radial-gradient(ellipse 110% 80% at 20% 80%, rgba(26, 117, 85, 0.13) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 80% 20%, rgba(125, 217, 168, 0.10) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 50%, rgba(61, 184, 127, 0.05) 0%, transparent 40%)`,
    report: `radial-gradient(ellipse 100% 80% at 5% 10%, rgba(196, 147, 90, 0.14) 0%, transparent 55%), radial-gradient(ellipse 90% 70% at 95% 85%, rgba(26, 117, 85, 0.10) 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 50% 50%, rgba(224, 180, 122, 0.07) 0%, transparent 45%)`,
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: gradientsByVariant[variant],
      }}
    />
  );
}

/** 필름 그레인 텍스처 오버레이 (강화) */
export function OgGrainTexture({ color }: { color?: string } = {}) {
  const dotColor = color ?? "rgba(0,0,0,0.08)";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(${dotColor} 0.5px, transparent 0.5px)`,
        backgroundSize: "5px 5px",
        opacity: 0.08,
      }}
    />
  );
}

/** 미세 도트 패턴 — 카드 내부 여백 해소 */
export function OgDotPattern({
  color,
  opacity = 0.03,
}: {
  color?: string;
  opacity?: number;
} = {}) {
  const dotColor = color ?? "rgba(0,0,0,0.12)";
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px",
        opacity,
      }}
    />
  );
}

/** 장식용 나뭇잎 SVG (잎맥 디테일 + 크기 옵션) */
export function OgLeafDecoration({
  color,
  position = "bottom-right",
  opacity = 0.08,
  leafSize = "md",
}: {
  color: string;
  position?: "top-right" | "bottom-left" | "bottom-right" | "top-left";
  opacity?: number;
  leafSize?: "sm" | "md" | "lg";
}) {
  const posStyles: Record<string, Record<string, number | string>> = {
    "top-right": { top: 20, right: 20 },
    "top-left": { top: 20, left: 20 },
    "bottom-right": { bottom: 50, right: 40 },
    "bottom-left": { bottom: 50, left: 40 },
  };

  const sizeMap = { sm: 80, md: 120, lg: 160 };
  const s = sizeMap[leafSize];

  return (
    <div
      style={{
        position: "absolute",
        ...posStyles[position],
        opacity,
        display: "flex",
      }}
    >
      <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
        {/* 큰 나뭇잎 */}
        <path
          d="M60 10 C75 25, 95 50, 80 80 C70 95, 45 95, 35 80 C20 55, 40 25, 60 10Z"
          fill={color}
          opacity="0.6"
        />
        {/* 주맥 (center vein) */}
        <path
          d="M60 10 C60 40, 58 60, 55 80"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* 측맥 (side veins) — 좌 */}
        <path d="M58 30 C50 35, 44 40, 40 46" stroke={color} strokeWidth="0.8" opacity="0.25" />
        <path d="M57 45 C48 50, 42 56, 38 62" stroke={color} strokeWidth="0.8" opacity="0.2" />
        <path d="M56 58 C49 63, 44 68, 42 73" stroke={color} strokeWidth="0.8" opacity="0.15" />
        {/* 측맥 — 우 */}
        <path d="M62 30 C70 34, 76 38, 78 44" stroke={color} strokeWidth="0.8" opacity="0.25" />
        <path d="M61 45 C68 49, 74 54, 76 60" stroke={color} strokeWidth="0.8" opacity="0.2" />
        <path d="M59 58 C66 62, 72 66, 74 71" stroke={color} strokeWidth="0.8" opacity="0.15" />
        {/* 작은 나뭇잎 */}
        <path
          d="M85 55 C95 45, 110 50, 105 65 C100 78, 88 75, 85 65 C83 60, 84 57, 85 55Z"
          fill={color}
          opacity="0.4"
        />
        {/* 줄기 */}
        <path
          d="M55 80 C50 90, 45 100, 40 110"
          stroke={color}
          strokeWidth="2"
          opacity="0.3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** 하단 물결 장식 — 숲 속 언덕/개울 느낌 */
export function OgWaveDecoration({
  color,
  opacity = 0.05,
}: {
  color: string;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
        opacity,
        display: "flex",
      }}
    >
      <svg width="1200" height="80" viewBox="0 0 1200 80" fill="none" preserveAspectRatio="none">
        <path
          d="M0 60 C200 20, 400 70, 600 40 C800 10, 1000 50, 1200 30 L1200 80 L0 80Z"
          fill={color}
          opacity="0.6"
        />
        <path
          d="M0 70 C300 40, 500 75, 700 55 C900 35, 1100 60, 1200 45 L1200 80 L0 80Z"
          fill={color}
          opacity="0.3"
        />
      </svg>
    </div>
  );
}

/** 장식용 책/독서 SVG (서재/노트 OG용) */
export function OgBookDecoration({
  color,
  position = "bottom-left",
  opacity = 0.06,
}: {
  color: string;
  position?: "top-right" | "bottom-left";
  opacity?: number;
}) {
  const posStyles: Record<string, Record<string, number | string>> = {
    "top-right": { top: 30, right: 30 },
    "bottom-left": { bottom: 40, left: 30 },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...posStyles[position],
        opacity,
        display: "flex",
      }}
    >
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
        <path
          d="M50 25 C40 20, 15 18, 10 22 L10 78 C15 74, 40 76, 50 82 C60 76, 85 74, 90 78 L90 22 C85 18, 60 20, 50 25Z"
          fill={color}
          opacity="0.5"
        />
        <path d="M50 25 L50 82" stroke={color} strokeWidth="1.5" opacity="0.3" />
        <path d="M20 35 L45 33" stroke={color} strokeWidth="1" opacity="0.2" />
        <path d="M20 45 L45 43" stroke={color} strokeWidth="1" opacity="0.2" />
        <path d="M20 55 L45 53" stroke={color} strokeWidth="1" opacity="0.2" />
        <path d="M55 33 L80 35" stroke={color} strokeWidth="1" opacity="0.2" />
        <path d="M55 43 L80 45" stroke={color} strokeWidth="1" opacity="0.2" />
        <path d="M55 53 L80 55" stroke={color} strokeWidth="1" opacity="0.2" />
      </svg>
    </div>
  );
}

/** 책 표지 3D 프레임 — 책등 + 광택 + 4중 그림자 */
export function OgBookCoverFrame({
  coverSrc,
  width,
  height,
  accentColor,
  borderRadius = 10,
}: {
  coverSrc: string | null;
  width: number;
  height: number;
  accentColor: string;
  borderRadius?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: width + 8,
        height,
        borderRadius,
        boxShadow: `0 30px 60px -12px rgba(0,0,0,0.22), 0 18px 36px -18px rgba(0,0,0,0.18), 0 4px 8px -2px rgba(0,0,0,0.10), 0 0 40px ${accentColor}15`,
      }}
    >
      {/* 책등 (spine) */}
      <div
        style={{
          width: 8,
          height: "100%",
          borderRadius: `${borderRadius}px 0 0 ${borderRadius}px`,
          background: `linear-gradient(90deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 60%, transparent 100%)`,
        }}
      />
      {/* 표지 */}
      <div
        style={{
          width,
          height: "100%",
          borderRadius: `0 ${borderRadius}px ${borderRadius}px 0`,
          overflow: "hidden",
          display: "flex",
          position: "relative",
        }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt=""
            width={width}
            height={height}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width,
              height,
              backgroundColor: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              color: "#64748b",
              fontWeight: 600,
              fontFamily: FONT_FAMILY,
            }}
          >
            No Cover
          </div>
        )}
        {/* 광택 오버레이 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.04) 100%)",
          }}
        />
      </div>
    </div>
  );
}

/** AI 스파클/매직 아이콘 (리포트용) */
export function OgSparkleIcon({
  size = 16,
  color = "white",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
      <path d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" opacity="0.7" />
      <path d="M5 2L5.5 3.5L7 4L5.5 4.5L5 6L4.5 4.5L3 4L4.5 3.5L5 2Z" opacity="0.5" />
    </svg>
  );
}

/** 스파클 산란 효과 (AI 아이콘 주변 장식) */
export function OgSparkleScatter({
  color,
  opacity = 0.15,
}: {
  color: string;
  opacity?: number;
}) {
  return (
    <div style={{ position: "absolute", top: -8, left: -8, right: -8, bottom: -8, opacity, display: "flex" }}>
      <svg width="52" height="52" viewBox="0 0 52 52" fill={color}>
        <circle cx="5" cy="8" r="1.5" opacity="0.8" />
        <circle cx="47" cy="12" r="1" opacity="0.6" />
        <circle cx="42" cy="44" r="1.2" opacity="0.7" />
        <circle cx="8" cy="40" r="0.8" opacity="0.5" />
        <path d="M44 5L44.5 6.5L46 7L44.5 7.5L44 9L43.5 7.5L42 7L43.5 6.5L44 5Z" opacity="0.6" />
        <path d="M6 22L6.3 23L7 23.3L6.3 23.6L6 24.5L5.7 23.6L5 23.3L5.7 23L6 22Z" opacity="0.4" />
      </svg>
    </div>
  );
}

/** 상단 포레스트 악센트 바 (7색 그래디언트 + 강화 글로우) */
export function OgAccentBar({ colors }: { colors?: OgColors } = {}) {
  const c = colors ?? OG_COLORS;
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        background: `linear-gradient(90deg, #0D5A3E, ${c.forest}, ${c.forestLight}, ${c.forestLighter}, ${c.forestLight}, ${c.forest}, #0D5A3E)`,
        boxShadow: `0 2px 16px rgba(26, 117, 85, 0.20), 0 1px 4px rgba(26, 117, 85, 0.10)`,
      }}
    />
  );
}

/** 어스톤 악센트 바 (리포트용, 강화) */
export function OgEarthAccentBar({ colors }: { colors?: OgColors } = {}) {
  const c = colors ?? OG_COLORS;
  return (
    <div
      style={{
        width: "100%",
        height: 8,
        background: `linear-gradient(90deg, #8B6B3D, ${c.earth}, ${c.earthLight}, ${c.forest}, ${c.earthLight}, ${c.earth}, #8B6B3D)`,
        boxShadow: `0 2px 16px rgba(196, 147, 90, 0.20), 0 1px 4px rgba(196, 147, 90, 0.10)`,
      }}
    />
  );
}

/** 하단 도메인 푸터 (나뭇잎 아이콘 + 세련된 스타일) */
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
        alignItems: "center",
        paddingBottom: 28,
        gap: 6,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3C16 3, 20 7, 18 13C16 18, 12 20, 12 20C12 20, 8 18, 6 13C4 7, 8 3, 12 3Z"
          fill={c.forestLight}
          opacity="0.5"
        />
        <path
          d="M12 3C12 10, 12 16, 12 20"
          stroke={c.forestLight}
          strokeWidth="1.5"
          opacity="0.4"
        />
      </svg>
      <div
        style={{
          fontSize: 16,
          color: c.textMuted,
          fontWeight: 500,
          fontFamily: FONT_FAMILY,
          letterSpacing: "0.08em",
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
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {iconSrc ? (
        <img src={iconSrc} alt="" width={iconSize} height={iconSize} style={{ borderRadius }} />
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
      <span style={{ fontSize, fontWeight: 800, color: c.textPrimary, fontFamily: FONT_FAMILY }}>
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
      <OgAuroraBackground colors={c} variant="home" />
      <OgGrainTexture />
      <OgWaveDecoration color={c.forest} opacity={0.04} />
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
          <img src={iconSrc} alt="" width={80} height={80} style={{ borderRadius: 20, marginBottom: 24 }} />
        ) : (
          <div
            style={{
              width: 80, height: 80, borderRadius: 20, backgroundColor: c.forest,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
            </svg>
          </div>
        )}
        <div style={{ fontSize: 28, fontWeight: 700, color: c.textPrimary, fontFamily: FONT_FAMILY }}>{b.name}</div>
        <div style={{ fontSize: 16, color: c.textSecondary, marginTop: 8, fontFamily: FONT_FAMILY }}>{message}</div>
      </div>
    </div>
  );
}
