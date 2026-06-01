import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import { isValidImageUrl } from "@/lib/utils/image";
import { OG_SIZE, FONT_FAMILY, OG_COLORS } from "@/lib/og/constants";
import {
  loadKoreanFont,
  loadBrandIcon,
  prefetchImageAsDataUri,
  truncateText,
  cleanText,
  buildFontOptions,
  createOgAnonSupabaseClient,
  createOgServiceSupabaseClient,
} from "@/lib/og/utils";
import { OgAuroraBackground, OgGrainTexture, OgBrandMark, OgFallbackContent } from "@/lib/og/components";
import type { RecapStats, RecapHighlights } from "@/app/actions/recap/types";

/**
 * 월간 독서결산 OG 이미지 (1200×630).
 * - 좌측: 완독 표지 스택 + 페르소나 타이틀
 * - 우측: 월 라벨 + 핵심 스탯 3종 + 베스트 인용 + 사용자
 *
 * 스탬프 OG(app/share/stamps/[id]/opengraph-image.tsx)와 톤 일치.
 */

export const alt = "ReadTree 월간 독서결산 공유";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

interface RecapRow {
  user_id: string;
  year: number;
  month: number;
  stats: RecapStats;
  highlights: RecapHighlights;
  ai_caption: string | null;
}

function formatDuration(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "0분";
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const fontData = await loadKoreanFont(
    new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url),
  );
  const fontOptions = buildFontOptions(fontData);
  const colors = OG_COLORS;
  const brandIconSrc = await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  try {
    const { id } = await params;
    if (!id || typeof id !== "string" || !isValidUUID(id)) {
      return fallback(fontOptions, brandIconSrc);
    }

    const supabase = createOgAnonSupabaseClient();
    const { data, error } = await supabase
      .from("monthly_recaps")
      .select("user_id, year, month, stats, highlights, ai_caption")
      .eq("share_id", id)
      .eq("is_public", true)
      .single();

    if (error || !data) return fallback(fontOptions, brandIconSrc);
    const row = data as unknown as RecapRow;
    const stats = row.stats;
    const highlights = row.highlights;

    // 사용자명
    let userName: string | null = null;
    try {
      const service = createOgServiceSupabaseClient();
      if (service && row.user_id) {
        const { data: u } = await service.from("users").select("name").eq("id", row.user_id).single();
        if (u) userName = u.name;
      }
    } catch {
      // ignore
    }

    // 완독 표지 (최대 3장 프리페치)
    const coverUrls = (highlights.completedCovers ?? []).filter((u) => isValidImageUrl(u)).slice(0, 3);
    const coverDataUris = (
      await Promise.all(coverUrls.map((u) => prefetchImageAsDataUri(u)))
    ).filter((x): x is string => !!x);

    const persona = truncateText(cleanText(highlights.personaTitle || "이달의 독서가"), 18);
    const quote = highlights.memorableQuote?.text
      ? truncateText(cleanText(highlights.memorableQuote.text), 60)
      : row.ai_caption
        ? truncateText(cleanText(row.ai_caption), 60)
        : null;
    const displayName = userName || "ReadTree 사용자";

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
          <OgAuroraBackground colors={colors} variant="note" />
          <OgGrainTexture />

          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 56px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                height: 490,
                backgroundColor: colors.cardBackground,
                borderRadius: 24,
                boxShadow: "0 25px 60px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}
            >
              {/* 좌측: 월 + 완독 표지 + 페르소나 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "32px 28px",
                  background: "linear-gradient(160deg, #065f46 0%, #047857 60%, #10b981 100%)",
                  width: 380,
                  gap: 18,
                  color: "#ffffff",
                }}
              >
                <div style={{ display: "flex", fontSize: 22, fontWeight: 700, opacity: 0.9, fontFamily: FONT_FAMILY }}>
                  {row.year}년 {row.month}월
                </div>

                {coverDataUris.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    {coverDataUris.map((uri, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={uri}
                        alt=""
                        width={110}
                        height={158}
                        style={{
                          borderRadius: 10,
                          objectFit: "cover",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.35)",
                          marginLeft: i === 0 ? 0 : -28,
                          border: "2px solid rgba(255,255,255,0.5)",
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", fontSize: 96, fontWeight: 800, fontFamily: FONT_FAMILY }}>
                    {row.month}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 800,
                    fontFamily: FONT_FAMILY,
                    textAlign: "center",
                    maxWidth: 320,
                    lineHeight: 1.3,
                  }}
                >
                  {persona}
                </div>
              </div>

              {/* 우측: 스탯 + 인용 + 사용자 */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  padding: "40px 44px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", gap: 28 }}>
                  <OgStat label="완독" value={`${stats.completedBooks}권`} />
                  <Divider />
                  <OgStat label="독서 시간" value={formatDuration(stats.totalReadingSeconds)} />
                  <Divider />
                  <OgStat label="기록" value={`${stats.totalNotes}개`} />
                </div>

                <div style={{ display: "flex", flexDirection: "row", gap: 28, marginTop: 18 }}>
                  <OgStat label="최대 연속" value={`${stats.maxStreakInMonth}일`} small />
                  <Divider />
                  <OgStat label="기록한 날" value={`${stats.activeDays}일`} small />
                  <Divider />
                  <OgStat label="읽은 책" value={`${stats.booksTouched}권`} small />
                </div>

                {quote ? (
                  <div style={{ display: "flex", flexDirection: "row", marginTop: 22 }}>
                    <div
                      style={{
                        width: 4,
                        borderRadius: 2,
                        backgroundColor: colors.forestLight,
                        marginRight: 16,
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        fontSize: 19,
                        lineHeight: 1.5,
                        color: "#334155",
                        fontFamily: FONT_FAMILY,
                        fontWeight: 500,
                        fontStyle: "italic",
                      }}
                    >
                      {quote}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1 }} />
                )}

                <div style={{ width: "100%", height: 1, backgroundColor: "#e5e7eb", marginTop: 16 }} />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: "#64748b", fontFamily: FONT_FAMILY }}>
                    {displayName}
                  </div>
                  <OgBrandMark iconSrc={brandIconSrc} size="sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size, ...fontOptions },
    );
  } catch {
    return fallback(fontOptions, brandIconSrc);
  }
}

function OgStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 11,
          color: "#94a3b8",
          fontFamily: FONT_FAMILY,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: small ? 24 : 34,
          fontWeight: 800,
          color: "#0f172a",
          fontFamily: FONT_FAMILY,
          marginTop: 4,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, backgroundColor: "#e5e7eb" }} />;
}

function fallback(fontOptions: Record<string, unknown>, brandIconSrc: string | null) {
  const colors = OG_COLORS;
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
        <OgAuroraBackground colors={colors} variant="note" />
        <OgGrainTexture />
        <OgFallbackContent
          iconSrc={brandIconSrc}
          message="공유되지 않은 결산이거나 존재하지 않습니다"
          colors={colors}
        />
      </div>
    ),
    { ...size, ...fontOptions },
  );
}
