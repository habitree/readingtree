import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import { OG_SIZE, OG_TEXT_LIMITS, FONT_FAMILY, OG_BRAND } from "@/lib/og/constants";
import {
  loadKoreanFont,
  prefetchImageAsDataUri,
  truncateText,
  buildFontOptions,
  createOgAnonSupabaseClient,
} from "@/lib/og/utils";

export const alt = "ReadTree Reading Review — AI 독서 리포트";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

/* 매거진(ReadTree Reading Review) 팔레트 */
const M = {
  ink: "#0C1F12",
  ink2: "#08160C",
  gold: "#E8C77E",
  gold2: "#C68A2E",
  goldSoft: "#C6A86A",
  cream: "#F6F1E4",
  body: "#E8F0E5",
  green: "#9FBF9C",
  green2: "#7FA17C",
};

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fontData = await loadKoreanFont(
    new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
  );
  const fontOptions = buildFontOptions(fontData);

  try {
    const { id: shareId } = await params;
    if (!shareId || typeof shareId !== "string" || !isValidUUID(shareId)) {
      return fallbackImageResponse(fontOptions);
    }

    const supabase = createOgAnonSupabaseClient();
    const { data: report, error } = await supabase
      .from("ai_generated_reports")
      .select("book_title, book_author, cover_image_url, note_count, report_markdown")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .single();

    if (!report || error) {
      return fallbackImageResponse(fontOptions);
    }

    const bookTitle = truncateText(report.book_title || "제목 없음", OG_TEXT_LIMITS.bookTitle);
    const bookAuthor = report.book_author || "저자 미상";

    // 첫 번째 핵심 인사이트 추출
    const insightMatch = report.report_markdown?.match(
      /##\s*(?:[\d.\s]*)?(?:핵심|인사이트|key|insight)[^\n]*\n([\s\S]*?)(?=\n##|$)/i
    );
    let insightPreview = insightMatch
      ? insightMatch[1].replace(/[#*\->`]/g, " ").replace(/\s+/g, " ").trim()
      : "";
    if (insightPreview.length > OG_TEXT_LIMITS.insightPreview) {
      insightPreview = insightPreview.slice(0, OG_TEXT_LIMITS.insightPreview - 1) + "…";
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
            position: "relative",
            fontFamily: FONT_FAMILY,
            background: `linear-gradient(155deg, ${M.ink} 0%, ${M.ink2} 100%)`,
          }}
        >
          {/* 글로우 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              background:
                "radial-gradient(60% 85% at 78% 8%, rgba(122,168,120,0.16), transparent 60%)",
            }}
          />
          {/* 골드 인셋 프레임 */}
          <div
            style={{
              position: "absolute",
              top: 26,
              left: 26,
              right: 26,
              bottom: 26,
              border: "1px solid rgba(232,199,126,0.30)",
              borderRadius: 4,
            }}
          />

          {/* 콘텐츠 */}
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              width: "100%",
              height: "100%",
              padding: "60px 76px",
              alignItems: "center",
              gap: 56,
            }}
          >
            {/* 좌: 책 표지 */}
            <div style={{ display: "flex", flexShrink: 0 }}>
              {coverDataUri ? (
                <img
                  src={coverDataUri}
                  alt=""
                  width={232}
                  height={344}
                  style={{
                    objectFit: "cover",
                    borderRadius: 4,
                    boxShadow: "0 24px 50px rgba(0,0,0,0.5)",
                    border: "1px solid rgba(156,101,18,0.35)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 232,
                    height: 344,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 4,
                    background: "linear-gradient(150deg,#F7F1E2,#E4D9BF)",
                    color: "#143420",
                    fontSize: 30,
                    fontWeight: 800,
                    textAlign: "center",
                    padding: 24,
                    boxShadow: "0 24px 50px rgba(0,0,0,0.5)",
                  }}
                >
                  {bookTitle}
                </div>
              )}
            </div>

            {/* 우: 마스트헤드 + 타이틀 + 인사이트 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                height: "100%",
                justifyContent: "center",
                gap: 16,
              }}
            >
              {/* 마스트헤드 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: M.gold, letterSpacing: "0.12em" }}>
                  READTREE
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ display: "flex", width: 40, height: 1, backgroundColor: "rgba(232,199,126,0.6)" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: M.goldSoft, letterSpacing: "0.3em" }}>
                    READING REVIEW
                  </span>
                </div>
              </div>

              {/* 책 제목 */}
              <div style={{ fontSize: 50, fontWeight: 800, color: M.cream, lineHeight: 1.12, maxWidth: 620 }}>
                {bookTitle}
              </div>
              {/* 저자 */}
              <div style={{ fontSize: 22, fontWeight: 600, color: M.green }}>{bookAuthor}</div>

              {/* 인사이트 한 줄 */}
              <div style={{ display: "flex", flexDirection: "row", marginTop: 8 }}>
                <div
                  style={{
                    display: "flex",
                    width: 4,
                    borderRadius: 3,
                    background: `linear-gradient(180deg, #E0B65E, ${M.gold2})`,
                    marginRight: 18,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 21, lineHeight: 1.6, color: M.body, fontWeight: 600, maxWidth: 560 }}>
                  {insightPreview}
                </div>
              </div>

              {/* 푸터 */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: M.green2 }}>
                  {`기록 ${report.note_count}개 기반 · 기록하는 만큼 자라는 독서`}
                </span>
                <span style={{ color: "rgba(232,199,126,0.4)" }}>·</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: M.goldSoft }}>{OG_BRAND.domain}</span>
              </div>
            </div>
          </div>
        </div>
      ),
      { ...size, ...fontOptions }
    );
  } catch (e) {
    console.error("[OG Image] Unexpected error:", e);
    return fallbackImageResponse(fontOptions);
  }
}

function fallbackImageResponse(fontOptions: Record<string, unknown> = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_FAMILY,
          background: `linear-gradient(155deg, ${M.ink} 0%, ${M.ink2} 100%)`,
          gap: 16,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: M.gold, letterSpacing: "0.12em" }}>
          READTREE
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: M.goldSoft, letterSpacing: "0.3em" }}>
          READING REVIEW
        </div>
        <div style={{ fontSize: 22, color: M.green, marginTop: 8 }}>
          이 리포트를 찾을 수 없거나 비공개입니다.
        </div>
      </div>
    ),
    { ...size, ...fontOptions }
  );
}
