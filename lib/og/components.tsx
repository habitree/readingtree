import { OG_COLORS, OG_BRAND, FONT_FAMILY } from "./constants";

/** 상단 포레스트 악센트 바 */
export function OgAccentBar() {
  return (
    <div
      style={{
        width: "100%",
        height: 5,
        background: `linear-gradient(90deg, ${OG_COLORS.forest}, ${OG_COLORS.forestLight}, ${OG_COLORS.forestLighter}, ${OG_COLORS.forestLight}, ${OG_COLORS.forest})`,
      }}
    />
  );
}

/** 하단 도메인 푸터 */
export function OgDomainFooter() {
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
          color: OG_COLORS.textMuted,
          fontWeight: 500,
          fontFamily: FONT_FAMILY,
        }}
      >
        {OG_BRAND.domain}
      </div>
    </div>
  );
}

/** 브랜드 마크 (아이콘 + 텍스트) — 카드 내부 */
export function OgBrandMark({
  iconSrc,
  size = "sm",
}: {
  iconSrc: string | null;
  size?: "sm" | "md";
}) {
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
            background: `linear-gradient(135deg, ${OG_COLORS.forest}, ${OG_COLORS.forestLight})`,
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
          color: OG_COLORS.textPrimary,
          fontFamily: FONT_FAMILY,
        }}
      >
        {OG_BRAND.name}
      </span>
    </div>
  );
}

/** 폴백 콘텐츠 (데이터 없을 때) */
export function OgFallbackContent({
  message,
  iconSrc,
}: {
  message: string;
  iconSrc?: string | null;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: OG_COLORS.background,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          padding: 48,
          backgroundColor: OG_COLORS.cardBackground,
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
              backgroundColor: OG_COLORS.forest,
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
            color: OG_COLORS.textPrimary,
            fontFamily: FONT_FAMILY,
          }}
        >
          {OG_BRAND.name}
        </div>
        <div
          style={{
            fontSize: 16,
            color: OG_COLORS.textSecondary,
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
