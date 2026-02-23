import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { isValidUUID } from "@/lib/utils/validation";

export const alt = "ReadTree AI 독서 리포트";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function createAnonSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function loadKoreanFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    );
    if (res.ok) return res.arrayBuffer();
  } catch {}
  try {
    const res = await fetch(
      "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-SemiBold.otf"
    );
    if (!res.ok) throw new Error("Failed to fetch font");
    return res.arrayBuffer();
  } catch (e) {
    console.error("[OG Image] Font fetch failed:", e);
    return null;
  }
}

async function prefetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ReadTree/1.0)" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 10 * 1024 * 1024) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${ct};base64,${base64}`;
  } catch {
    return null;
  }
}

const FONT_FAMILY = '"NotoSansKR", sans-serif';

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let fontOptions: Record<string, unknown> = {};

  try {
    const fontData = await loadKoreanFont();
    fontOptions = fontData
      ? {
          fonts: [
            {
              name: "NotoSansKR",
              data: fontData,
              style: "normal" as const,
              weight: 600 as const,
            },
          ],
        }
      : {};
  } catch {
    // 폰트 로드 실패 시 기본 폰트
  }

  try {
    const { id: shareId } = await params;

    if (!shareId || typeof shareId !== "string" || !isValidUUID(shareId)) {
      return fallbackImageResponse(fontOptions);
    }

    const supabase = createAnonSupabaseClient();
    const { data: report, error } = await supabase
      .from("ai_generated_reports")
      .select("book_title, book_author, cover_image_url, note_count, report_markdown")
      .eq("share_id", shareId)
      .eq("is_public", true)
      .single();

    if (!report || error) {
      return fallbackImageResponse(fontOptions);
    }

    const bookTitle =
      (report.book_title || "제목 없음").length > 40
        ? report.book_title.slice(0, 37) + "..."
        : report.book_title || "제목 없음";
    const bookAuthor = report.book_author || "저자 미상";

    // 리포트에서 첫 번째 인사이트 추출 (미리보기용)
    const insightMatch = report.report_markdown?.match(
      /##\s*(?:핵심|인사이트|key|insight)[^\n]*\n([\s\S]*?)(?=\n##|$)/i
    );
    let insightPreview = insightMatch
      ? insightMatch[1].replace(/[#*\->\n]/g, " ").trim()
      : "";
    if (insightPreview.length > 120) {
      insightPreview = insightPreview.slice(0, 117) + "...";
    }
    if (!insightPreview) {
      insightPreview = `기록 ${report.note_count}개를 분석한 AI 독서 리포트`;
    }

    // 표지 이미지 base64 변환
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
            backgroundColor: "#faf8f5",
            backgroundImage:
              "radial-gradient(circle at 0% 0%, rgba(180, 140, 80, 0.08) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(22, 163, 74, 0.06) 0%, transparent 50%)",
          }}
        >
          {/* 상단 어스 톤 바 */}
          <div
            style={{
              width: "100%",
              height: 4,
              background: "linear-gradient(90deg, #b48c50, #d4a574, #16a34a)",
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
                backgroundColor: "white",
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
                        background: "linear-gradient(135deg, #b48c50, #d4a574)",
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

                  {/* 기록 수 배지 */}
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
                        backgroundColor: "#d4a574",
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

                {/* ReadTree 브랜딩 */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      backgroundColor: "#16a34a",
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
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#374151",
                      letterSpacing: "-0.02em",
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    ReadTree
                  </span>
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
                color: "#94a3b8",
                fontWeight: 500,
                fontFamily: FONT_FAMILY,
              }}
            >
              readingtree.app
            </span>
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
          backgroundColor: "#faf8f5",
          fontFamily: FONT_FAMILY,
        }}
      >
        <div
          style={{
            padding: 48,
            backgroundColor: "white",
            borderRadius: 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: "#16a34a",
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
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#0f172a",
              fontFamily: FONT_FAMILY,
            }}
          >
            ReadTree
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#64748b",
              marginTop: 8,
              fontFamily: FONT_FAMILY,
            }}
          >
            이 리포트를 찾을 수 없거나 비공개입니다.
          </div>
        </div>
      </div>
    ),
    { ...size, ...fontOptions }
  );
}
