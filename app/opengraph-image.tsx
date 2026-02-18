import { ImageResponse } from "next/og";

// 이미지 메타데이터
export const runtime = "edge";
export const alt = "ReadTree - 독서 기록 및 공유 플랫폼";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  // 한글 폰트 로드 (Noto Sans KR)
  // Vercel Edge Runtime에서 외부 폰트 로드를 위해 fetch 사용
  // 실패 시 기본 폰트 사용을 위해 예외 처리 추가
  let notoSansKrSemiBold: ArrayBuffer | null = null;

  try {
    notoSansKrSemiBold = await fetch(
      new URL("https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-SemiBold.otf", import.meta.url)
    ).then((res) => {
      if (!res.ok) throw new Error('Failed to fetch font');
      return res.arrayBuffer();
    });
  } catch (e) {
    console.error('Font fetch failed:', e);
    // 폰트 로드 실패 시 별도 처리 없이 기본 폰트 사용
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0fdf4",
          backgroundImage: "radial-gradient(circle at 20% 20%, #dcfce7 0%, transparent 50%), radial-gradient(circle at 80% 80%, #bbf7d0 0%, transparent 50%)",
        }}
      >
        {/* 배경 패턴 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(#16a34a 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            opacity: 0.1,
          }}
        />

        {/* 메인 카드 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: 40,
            padding: "60px 100px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            gap: 24,
          }}
        >
          {/* 아이콘 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 30,
              backgroundColor: "#16a34a",
              marginBottom: 10,
              boxShadow: "0 10px 15px -3px rgba(22, 163, 74, 0.3)",
            }}
          >
            {/* 나무 아이콘 */}
            <svg
              width="70"
              height="70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22v-7M9 22h6" />
              <path d="M17 7A5 5 0 0 0 7 7" />
              <path d="M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
              <path d="M12 5V2" />
            </svg>
          </div>

          {/* 브랜드명 */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#14532d",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontFamily: '"NotoSansKR", sans-serif',
            }}
          >
            ReadTree
          </div>

          {/* 태그라인 */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              color: "#4b5563",
              fontFamily: '"NotoSansKR", sans-serif',
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            독서 기록 및 공유 플랫폼
          </div>

          {/* 키워드 태그 */}
          <div style={{ display: "flex", gap: 16 }}>
            <div
              style={{
                padding: "10px 24px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #dcfce7",
                borderRadius: "9999px",
                color: "#166534",
                fontSize: 20,
                fontWeight: 600,
                fontFamily: '"NotoSansKR", sans-serif',
              }}
            >
              책 관리
            </div>
            <div
              style={{
                padding: "10px 24px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #dcfce7",
                borderRadius: "9999px",
                color: "#166534",
                fontSize: 20,
                fontWeight: 600,
                fontFamily: '"NotoSansKR", sans-serif',
              }}
            >
              독서 노트
            </div>
            <div
              style={{
                padding: "10px 24px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #dcfce7",
                borderRadius: "9999px",
                color: "#166534",
                fontSize: 20,
                fontWeight: 600,
                fontFamily: '"NotoSansKR", sans-serif',
              }}
            >
              AI 도우미
            </div>
          </div>
        </div>

        {/* 하단 도메인 표시 */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#6b7280",
            fontWeight: 500,
            fontFamily: '"NotoSansKR", sans-serif',
          }}
        >
          readingtree-tan.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
      fonts: notoSansKrSemiBold ? [
        {
          name: "NotoSansKR",
          data: notoSansKrSemiBold,
          style: "normal",
          weight: 600,
        },
      ] : undefined,
    }
  );
}
