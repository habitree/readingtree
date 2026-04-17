import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { isValidUUID } from "@/lib/utils/validation";

// Fluid Compute (Node.js) 런타임 사용.
// Edge Runtime 1MB 크기 제한을 회피하고, next/og ImageResponse는 Node에서도 정상 동작.
// 참고: https://vercel.com/docs/functions/runtimes/node-js

const CARD_SIZES = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

type CardRatio = keyof typeof CARD_SIZES;

const FONT_FAMILY = '"NotoSansKR", sans-serif';

async function loadKoreanFont(requestUrl?: string): Promise<ArrayBuffer | null> {
  // 1순위: 동일 오리진 /public/fonts/ 에서 가져오기 (Vercel 정적 파일, 가장 안정적)
  if (requestUrl) {
    try {
      const origin = new URL(requestUrl).origin;
      const res = await fetch(`${origin}/fonts/NotoSansKR-SemiBold.otf`);
      if (res.ok) return res.arrayBuffer();
    } catch {}
  }
  // 2순위: import.meta.url 번들 경로 (로컬 개발)
  try {
    const res = await fetch(
      new URL(
        "../../../../../../public/fonts/NotoSansKR-SemiBold.otf",
        import.meta.url
      )
    );
    if (res.ok) return res.arrayBuffer();
  } catch {}
  // 3순위: jsDelivr CDN (GitHub CDN 대비 안정적)
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosanskr/NotoSansKR-SemiBold.otf"
    );
    if (!res.ok) throw new Error("Font fetch failed");
    return res.arrayBuffer();
  } catch {
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
    // Edge Runtime 호환: Buffer 대신 btoa + Uint8Array 사용
    const uint8 = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.slice(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    return `data:${ct};base64,${base64}`;
  } catch {
    return null;
  }
}

function formatReadingPeriod(
  startedAt: string | null,
  completedAt: string | null
): string {
  if (!startedAt) return "";
  const start = new Date(startedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  if (!completedAt) return `${start} ~`;
  const end = new Date(completedAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return `${start} ~ ${end}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shareId } = await params;
  const url = new URL(request.url);
  const ratio = (url.searchParams.get("ratio") ?? "square") as CardRatio;

  if (!isValidUUID(shareId)) {
    return new Response("Invalid share ID", { status: 400 });
  }
  if (!CARD_SIZES[ratio]) {
    return new Response("Invalid ratio", { status: 400 });
  }

  const size = CARD_SIZES[ratio];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: report, error } = await supabase
    .from("ai_generated_reports")
    .select(
      "book_title, book_author, cover_image_url, note_count, started_at, completed_at"
    )
    .eq("share_id", shareId)
    .eq("is_public", true)
    .single();

  if (!report || error) {
    return new Response("Report not found", { status: 404 });
  }

  const [fontData, coverDataUri] = await Promise.all([
    loadKoreanFont(request.url),
    report.cover_image_url
      ? prefetchImageAsDataUri(report.cover_image_url)
      : Promise.resolve(null),
  ]);

  const fontOptions = fontData
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

  const rawTitle: string = report.book_title || "제목 없음";
  const bookTitle =
    rawTitle.length > 20 ? rawTitle.slice(0, 18) + "..." : rawTitle;
  const bookAuthor: string = report.book_author || "저자 미상";
  const readingPeriod = formatReadingPeriod(
    report.started_at,
    report.completed_at
  );
  const isPortrait = ratio === "portrait";
  const coverW = isPortrait ? 200 : 160;
  const coverH = isPortrait ? 300 : 240;

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
          backgroundColor: "#faf8f5",
          padding: isPortrait ? "60px 80px" : "48px 80px",
        }}
      >
        {/* 상단 어스톤 바 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #b48c50, #d4a574, #16a34a)",
          }}
        />

        {/* 카드 본체 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: 24,
            boxShadow:
              "0 20px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04)",
            padding: isPortrait ? "56px 64px" : "48px 64px",
            width: "100%",
            gap: isPortrait ? 28 : 24,
          }}
        >
          {/* AI 리포트 뱃지 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#faf5ee",
              borderRadius: 99,
              padding: "6px 16px",
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                background: "linear-gradient(135deg, #b48c50, #d4a574)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="10"
                height="10"
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
                fontSize: 14,
                fontWeight: 700,
                color: "#78716c",
                fontFamily: FONT_FAMILY,
              }}
            >
              AI 독서 리포트
            </span>
          </div>

          {/* 책 표지 */}
          {coverDataUri ? (
            <img
              src={coverDataUri}
              alt=""
              width={coverW}
              height={coverH}
              style={{
                objectFit: "cover",
                borderRadius: 10,
                boxShadow:
                  "0 16px 36px -10px rgba(0, 0, 0, 0.28), 0 4px 10px -4px rgba(0, 0, 0, 0.12)",
              }}
            />
          ) : (
            <div
              style={{
                width: coverW,
                height: coverH,
                backgroundColor: "#e8e4de",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "#8c7e6e",
                fontWeight: 600,
                fontFamily: FONT_FAMILY,
                boxShadow: "0 12px 28px -8px rgba(0, 0, 0, 0.15)",
              }}
            >
              표지 없음
            </div>
          )}

          {/* 책 제목 & 저자 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: isPortrait ? 32 : 26,
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.3,
                fontFamily: FONT_FAMILY,
              }}
            >
              {bookTitle}
            </div>
            <div
              style={{
                fontSize: isPortrait ? 18 : 16,
                color: "#64748b",
                fontWeight: 600,
                fontFamily: FONT_FAMILY,
              }}
            >
              {bookAuthor}
            </div>
          </div>

          {/* 구분선 */}
          <div
            style={{ width: "60%", height: 1, backgroundColor: "#e5e7eb" }}
          />

          {/* 기록 정보 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: isPortrait ? 16 : 14,
                color: "#78716c",
                fontWeight: 600,
                fontFamily: FONT_FAMILY,
              }}
            >
              기록 {report.note_count}개를 분석한 나의 독서 리포트
            </div>
            {readingPeriod && (
              <div
                style={{
                  fontSize: isPortrait ? 14 : 12,
                  color: "#a8a29e",
                  fontWeight: 500,
                  fontFamily: FONT_FAMILY,
                }}
              >
                {readingPeriod}
              </div>
            )}
          </div>
        </div>

        {/* 브랜딩 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              backgroundColor: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="12"
              height="12"
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
              fontSize: 13,
              fontWeight: 800,
              color: "#64748b",
              letterSpacing: "-0.02em",
              fontFamily: FONT_FAMILY,
            }}
          >
            ReadTree
          </span>
          <span
            style={{
              fontSize: 12,
              color: "#94a3b8",
              fontWeight: 500,
              fontFamily: FONT_FAMILY,
              marginLeft: 4,
            }}
          >
            readingtree.app
          </span>
        </div>

        {/* 하단 어스톤 바 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, #16a34a, #d4a574, #b48c50)",
          }}
        />
      </div>
    ),
    { ...size, ...fontOptions }
  );
}
