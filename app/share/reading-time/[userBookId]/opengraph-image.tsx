import { ImageResponse } from "next/og";
import { isValidUUID } from "@/lib/utils/validation";
import { OG_SIZE, OG_TEXT_LIMITS, FONT_FAMILY } from "@/lib/og/constants";
import {
  loadKoreanFont,
  loadBrandIcon,
  loadBrandIconFromUrl,
  prefetchImageAsDataUri,
  truncateText,
  buildFontOptions,
  createOgAdminSupabaseClient,
} from "@/lib/og/utils";
import {
  OgBrandMark,
  OgFallbackContent,
  OgAccentBar,
  OgAuroraBackground,
  OgGrainTexture,
  OgLeafDecoration,
  OgBookCoverFrame,
} from "@/lib/og/components";
import { getOgConfig } from "@/lib/og/settings";

export const alt = "ReadTree 독서 시간 카드";
export const size = OG_SIZE;
export const contentType = "image/png";
export const runtime = "nodejs";
export const revalidate = 3600;

interface LogRow {
  reading_duration_seconds: number | null;
  start_page: number | null;
  end_page: number | null;
}

/** OG 카드 렌더용 뷰모델 — 데이터 조회 성공 시에만 채워진다 */
interface ReadingTimeCardVM {
  bookTitle: string;
  bookAuthor: string;
  coverDataUri: string | null;
  durationText: string;
  sessionCount: number;
  totalPagesRead: number;
  progressPct: number | null;
}

function fmtDuration(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "1분 미만";
}

/**
 * userBookId → OG 카드 뷰모델. 조회 실패·비유효 시 null(→ 폴백 렌더).
 * JSX 구성은 이 함수 밖(try/catch 외부)에서 수행한다.
 */
async function buildCardVM(
  paramsPromise: Promise<{ userBookId: string }>,
): Promise<ReadingTimeCardVM | null> {
  try {
    const { userBookId } = await paramsPromise;
    if (!userBookId || typeof userBookId !== "string" || !isValidUUID(userBookId)) {
      return null;
    }

    const supabase = createOgAdminSupabaseClient();

    const { data: userBook, error } = await supabase
      .from("user_books")
      .select("user_id, books(title, author, cover_image_url, total_pages)")
      .eq("id", userBookId)
      .single();

    if (!userBook || error) return null;

    const booksField = (
      userBook as unknown as {
        books:
          | { title: string; author: string | null; cover_image_url: string | null; total_pages: number | null }
          | { title: string; author: string | null; cover_image_url: string | null; total_pages: number | null }[]
          | null;
      }
    ).books;
    const book = Array.isArray(booksField) ? booksField[0] ?? null : booksField;
    if (!book) return null;

    const { data: logsData } = await supabase
      .from("reading_logs")
      .select("reading_duration_seconds, start_page, end_page")
      .eq("user_book_id", userBookId)
      .gt("reading_duration_seconds", 0);

    const logs = (logsData ?? []) as LogRow[];
    const totalSeconds = logs.reduce((s, l) => s + (l.reading_duration_seconds || 0), 0);
    const sessionCount = logs.length;
    const totalPagesRead = logs.reduce((sum, l) => {
      const sp = typeof l.start_page === "number" ? l.start_page : 0;
      const ep = typeof l.end_page === "number" ? l.end_page : sp;
      return sum + Math.max(0, ep - sp);
    }, 0);
    const progressPct =
      book.total_pages && totalPagesRead > 0
        ? Math.min(100, Math.round((totalPagesRead / book.total_pages) * 100))
        : null;

    const coverDataUri = book.cover_image_url
      ? await prefetchImageAsDataUri(book.cover_image_url)
      : null;

    return {
      bookTitle: truncateText(book.title || "제목 없음", OG_TEXT_LIMITS.bookTitle),
      bookAuthor: book.author || "저자 미상",
      coverDataUri,
      durationText: fmtDuration(totalSeconds),
      sessionCount,
      totalPagesRead,
      progressPct,
    };
  } catch (e) {
    console.error("[OG Image · ReadingTime] Unexpected error:", e);
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ userBookId: string }>;
}) {
  const [fontData, config] = await Promise.all([
    loadKoreanFont(
      new URL("../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url),
    ),
    getOgConfig(),
  ]);
  const fontOptions = buildFontOptions(fontData);
  const { brand, colors } = config;

  const brandIconSrc = config.brandIconUrl
    ? await loadBrandIconFromUrl(config.brandIconUrl)
    : await loadBrandIcon(new URL("../../../icon.png", import.meta.url));

  // 데이터 조회(가변)는 try/catch 안, JSX 구성은 밖 — error-boundary 규칙 준수
  const vm = await buildCardVM(params);

  if (!vm) {
    return new ImageResponse(
      (
        <OgFallbackContent
          message="독서 시간 기록을 찾을 수 없거나 비공개입니다."
          iconSrc={brandIconSrc}
          brand={brand}
          colors={colors}
        />
      ),
      { ...size, ...fontOptions },
    );
  }

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
        <OgAccentBar colors={colors} />
        <OgAuroraBackground colors={colors} variant="home" />
        <OgGrainTexture />
        <OgLeafDecoration
          color={colors.forestLight}
          position="bottom-right"
          opacity={0.07}
          leafSize="md"
        />

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
            {/* 좌: 표지 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 32px",
                background: `linear-gradient(160deg, rgba(34, 197, 94, 0.08) 0%, rgba(45, 212, 191, 0.05) 50%, rgba(250, 245, 238, 0.9) 100%), linear-gradient(180deg, #faf5ee 0%, #fdf9f3 100%)`,
                width: 320,
                gap: 20,
              }}
            >
              <OgBookCoverFrame
                coverSrc={vm.coverDataUri}
                width={168}
                height={248}
                accentColor={colors.forest}
              />
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
                {vm.bookTitle}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#64748b",
                  fontFamily: FONT_FAMILY,
                }}
              >
                {vm.bookAuthor}
              </div>
            </div>

            {/* 우: 독서 시간 히어로 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "44px 48px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#059669",
                    fontFamily: FONT_FAMILY,
                    letterSpacing: "0.12em",
                  }}
                >
                  ⏱ READING TIME
                </div>

                <div
                  style={{
                    display: "flex",
                    fontSize: 76,
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.05,
                    fontFamily: FONT_FAMILY,
                  }}
                >
                  {vm.durationText}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 999,
                      backgroundColor: "rgba(16,185,129,0.10)",
                      color: "#047857",
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: FONT_FAMILY,
                    }}
                  >
                    {vm.sessionCount}세션
                  </div>
                  {vm.totalPagesRead > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 999,
                        backgroundColor: "rgba(196,147,90,0.12)",
                        color: "#9a6a2f",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      {vm.totalPagesRead}p 읽음
                    </div>
                  )}
                  {vm.progressPct !== null && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 999,
                        backgroundColor: "rgba(15,23,42,0.06)",
                        color: "#334155",
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: FONT_FAMILY,
                      }}
                    >
                      {vm.progressPct}% 진행
                    </div>
                  )}
                </div>
              </div>

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

        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 16 }}>
          <span
            style={{
              fontSize: 14,
              color: colors.textMuted,
              fontWeight: 500,
              fontFamily: FONT_FAMILY,
              letterSpacing: "0.08em",
            }}
          >
            {brand.domain}
          </span>
        </div>
      </div>
    ),
    { ...size, ...fontOptions },
  );
}
