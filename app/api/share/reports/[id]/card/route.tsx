import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { isValidUUID } from "@/lib/utils/validation";
import { loadKoreanFont, buildFontOptions } from "@/lib/og/utils";

// Fluid Compute (Node.js) 런타임 사용.
// Edge Runtime 1MB 크기 제한을 회피하고, next/og ImageResponse는 Node에서도 정상 동작.
// 참고: https://vercel.com/docs/functions/runtimes/node-js

const CARD_SIZES = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
} as const;

type CardRatio = keyof typeof CARD_SIZES;

const FONT_FAMILY = '"NotoSansKR", sans-serif';

/* 매거진(ReadTree Reading Review) 팔레트 */
const M = {
  ink: "#0C1F12",
  ink2: "#08160C",
  gold: "#E8C77E",
  gold2: "#C68A2E",
  goldSoft: "#C6A86A",
  cream: "#F6F1E4",
  green: "#9FBF9C",
  green2: "#7FA17C",
};

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
    loadKoreanFont(
      new URL("../../../../../../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
    ),
    report.cover_image_url
      ? prefetchImageAsDataUri(report.cover_image_url)
      : Promise.resolve(null),
  ]);

  const fontOptions = buildFontOptions(fontData);

  const rawTitle: string = report.book_title || "제목 없음";
  const bookTitle =
    rawTitle.length > 22 ? rawTitle.slice(0, 20) + "…" : rawTitle;
  const bookAuthor: string = report.book_author || "저자 미상";
  const readingPeriod = formatReadingPeriod(
    report.started_at,
    report.completed_at
  );
  const isPortrait = ratio === "portrait";
  const coverW = isPortrait ? 240 : 200;
  const coverH = isPortrait ? 356 : 296;

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
          position: "relative",
          fontFamily: FONT_FAMILY,
          background: `linear-gradient(160deg, ${M.ink} 0%, ${M.ink2} 100%)`,
          padding: isPortrait ? "72px" : "64px",
        }}
      >
        {/* 글로우 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(70% 50% at 50% 0%, rgba(122,168,120,0.16), transparent 60%)",
          }}
        />
        {/* 골드 인셋 프레임 */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: "1px solid rgba(232,199,126,0.28)",
            borderRadius: 6,
          }}
        />

        {/* 콘텐츠 */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: isPortrait ? 30 : 26,
          }}
        >
          {/* 마스트헤드 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: isPortrait ? 46 : 40, fontWeight: 800, color: M.gold, letterSpacing: "0.14em" }}>
              READTREE
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", width: 44, height: 1, backgroundColor: "rgba(232,199,126,0.55)" }} />
              <span style={{ fontSize: isPortrait ? 16 : 14, fontWeight: 700, color: M.goldSoft, letterSpacing: "0.34em" }}>
                READING REVIEW
              </span>
              <div style={{ display: "flex", width: 44, height: 1, backgroundColor: "rgba(232,199,126,0.55)" }} />
            </div>
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
                borderRadius: 5,
                boxShadow: "0 24px 54px rgba(0,0,0,0.5)",
                border: "1px solid rgba(156,101,18,0.4)",
              }}
            />
          ) : (
            <div
              style={{
                width: coverW,
                height: coverH,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 5,
                background: "linear-gradient(150deg,#F7F1E2,#E4D9BF)",
                color: "#143420",
                fontSize: 26,
                fontWeight: 800,
                textAlign: "center",
                padding: 24,
                boxShadow: "0 24px 54px rgba(0,0,0,0.5)",
              }}
            >
              {bookTitle}
            </div>
          )}

          {/* 책 제목 & 저자 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: isPortrait ? 40 : 34, fontWeight: 800, color: M.cream, lineHeight: 1.25, maxWidth: 720 }}>
              {bookTitle}
            </div>
            <div style={{ fontSize: isPortrait ? 20 : 18, fontWeight: 600, color: M.green }}>
              {bookAuthor}
            </div>
          </div>

          {/* 골드 디바이더 */}
          <div
            style={{
              display: "flex",
              width: 120,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(232,199,126,0.7), transparent)",
            }}
          />

          {/* 기록 정보 */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: isPortrait ? 19 : 17, fontWeight: 600, color: M.cream }}>
              {`기록 ${report.note_count}개를 분석한 나의 독서 리포트`}
            </div>
            {readingPeriod ? (
              <div style={{ fontSize: isPortrait ? 15 : 13, fontWeight: 500, color: M.green2 }}>
                {readingPeriod}
              </div>
            ) : null}
          </div>
        </div>

        {/* 푸터 (프레임 하단) */}
        <div
          style={{
            position: "absolute",
            bottom: isPortrait ? 56 : 50,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: M.green2, letterSpacing: "0.02em" }}>
            기록하는 만큼 자라는 독서
          </span>
          <span style={{ color: "rgba(232,199,126,0.4)" }}>·</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: M.goldSoft, letterSpacing: "0.04em" }}>
            readingtree.app
          </span>
        </div>
      </div>
    ),
    { ...size, ...fontOptions }
  );
}
