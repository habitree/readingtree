import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import { OG_SIZE, FONT_FAMILY, OG_COLORS } from "@/lib/og/constants";
import {
  loadKoreanFont,
  loadBrandIcon,
  truncateText,
  cleanText,
  buildFontOptions,
  createOgAnonSupabaseClient,
  createOgServiceSupabaseClient,
} from "@/lib/og/utils";
import { OgAuroraBackground, OgGrainTexture, OgBrandMark, OgFallbackContent } from "@/lib/og/components";
import { formatReadingTime } from "@/lib/recap/text";
import type { YearlyRecapComputed } from "@/lib/recap/yearly";

/**
 * 연간 독서결산 OG 이미지 (1200×630) — REQ-0014.
 * 좌측: 연도 + 독서 타입 / 우측: 핵심 수치 4종
 */

export const alt = "ReadTree 연간 독서결산 공유";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

interface YearlyRow {
  user_id: string;
  year: number;
  stats: YearlyRecapComputed["stats"];
  highlights: YearlyRecapComputed["highlights"];
}

/** 공개 결산 행 + 사용자명. 없거나 비공개면 null */
async function loadRow(id: string): Promise<{ row: YearlyRow; userName: string | null } | null> {
  try {
    if (!id || typeof id !== "string" || !isValidUUID(id)) return null;

    const supabase = createOgAnonSupabaseClient();
    const { data, error } = await supabase
      .from("yearly_recaps")
      .select("user_id, year, stats, highlights")
      .eq("share_id", id)
      .eq("is_public", true)
      .single();
    if (error || !data) return null;
    const row = data as unknown as YearlyRow;

    let userName: string | null = null;
    const service = createOgServiceSupabaseClient();
    if (service) {
      const { data: u } = await service.from("users").select("name").eq("id", row.user_id).maybeSingle();
      if (u) userName = u.name;
    }
    return { row, userName };
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const fontData = await loadKoreanFont(
    new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url),
  );
  const fontOptions = buildFontOptions(fontData);
  const brandIconSrc = await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  const { id } = await params;
  const loaded = await loadRow(id);
  if (!loaded) return fallback(fontOptions, brandIconSrc);
  const { row, userName } = loaded;

  const persona = truncateText(cleanText(row.highlights.personaTitle || "올해의 독서가"), 18);
  const stats: Array<[string, string]> = [
    ["독서 시간", formatReadingTime(row.stats.totalReadingSeconds)],
    ["완독", `${row.stats.completedBooks}권`],
    ["기록", `${row.stats.totalNotes}개`],
    ["독서한 날", `${row.stats.activeDays}일`],
  ];

  return new ImageResponse(
    (
      <div
        style={{ width: "100%", height: "100%", display: "flex", fontFamily: FONT_FAMILY, backgroundColor: "#0E2A1F" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 520,
            padding: "0 56px",
            color: "#F3EFE4",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, opacity: 0.75 }}>
            {userName ? `${truncateText(cleanText(userName), 10)}님의 독서 결산` : "독서 결산"}
          </div>
          <div style={{ display: "flex", fontSize: 168, fontWeight: 800, color: "#E8C77E", lineHeight: 1.1 }}>
            {row.year}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, lineHeight: 1.3 }}>{persona}</div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            margin: 40,
            padding: "44px 48px",
            borderRadius: 24,
            backgroundColor: "#F3EFE4",
            color: "#14301F",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
            {stats.map(([label, value]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", width: 230 }}>
                <span style={{ fontSize: 20, opacity: 0.65 }}>{label}</span>
                <span style={{ fontSize: 46, fontWeight: 800, marginTop: 4 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <OgBrandMark iconSrc={brandIconSrc} size="sm" />
          </div>
        </div>
      </div>
    ),
    { ...size, ...fontOptions },
  );
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
