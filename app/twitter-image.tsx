import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ReadTree - 독서 기록 및 공유 플랫폼";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const [fontResult, iconResult] = await Promise.allSettled([
    fetch(
      new URL("https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-SemiBold.otf", import.meta.url)
    ).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch font");
      return res.arrayBuffer();
    }),
    fetch(new URL("./icon.png", import.meta.url)).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch icon");
      return res.arrayBuffer();
    }),
  ]);

  const notoSansKrSemiBold =
    fontResult.status === "fulfilled" ? fontResult.value : null;
  const iconData =
    iconResult.status === "fulfilled" ? iconResult.value : null;

  const iconSrc = iconData
    ? `data:image/png;base64,${Buffer.from(iconData).toString("base64")}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FDFBF7",
          fontFamily: '"NotoSansKR", sans-serif',
        }}
      >
        {/* 상단 포레스트 악센트 바 */}
        <div
          style={{
            width: "100%",
            height: 5,
            background: "linear-gradient(90deg, #1d6b4d, #36a678, #5ec496, #36a678, #1d6b4d)",
          }}
        />

        {/* 미묘한 텍스처 패턴 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(#1d6b4d 0.6px, transparent 0.6px)",
            backgroundSize: "32px 32px",
            opacity: 0.025,
          }}
        />

        {/* 따뜻한 그라데이션 오버레이 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(ellipse at 20% 50%, rgba(29, 107, 77, 0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(94, 196, 150, 0.03) 0%, transparent 60%)",
          }}
        />

        {/* 메인 콘텐츠 */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "0 80px",
          }}
        >
          {/* HABITREE 로고 이미지 */}
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              width={150}
              height={150}
              style={{
                borderRadius: 32,
                boxShadow:
                  "0 16px 32px -8px rgba(29, 107, 77, 0.2), 0 0 0 1px rgba(29, 107, 77, 0.08)",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 150,
                height: 150,
                borderRadius: 32,
                backgroundColor: "#24855e",
                boxShadow: "0 16px 32px -8px rgba(29, 107, 77, 0.3)",
              }}
            >
              <svg
                width="80"
                height="80"
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
          )}

          {/* 브랜드명 */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: "#1F2933",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontFamily: '"NotoSansKR", sans-serif',
              marginTop: 4,
            }}
          >
            ReadTree
          </div>

          {/* 태그라인 */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#24855e",
              fontFamily: '"NotoSansKR", sans-serif',
              textAlign: "center",
            }}
          >
            독서 기록 및 공유 플랫폼
          </div>

          {/* 구분선 + 키워드 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 56,
                height: 2,
                backgroundColor: "#c3eed4",
                borderRadius: 1,
              }}
            />
            <div
              style={{
                fontSize: 21,
                fontWeight: 600,
                color: "#7B8794",
                fontFamily: '"NotoSansKR", sans-serif',
                letterSpacing: "0.01em",
              }}
            >
              책 관리 · 독서 노트 · AI 도우미
            </div>
            <div
              style={{
                width: 56,
                height: 2,
                backgroundColor: "#c3eed4",
                borderRadius: 1,
              }}
            />
          </div>
        </div>

        {/* 하단 도메인 */}
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
              color: "#9AA5B1",
              fontWeight: 500,
              fontFamily: '"NotoSansKR", sans-serif',
            }}
          >
            readingtree.app
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: notoSansKrSemiBold
        ? [
            {
              name: "NotoSansKR",
              data: notoSansKrSemiBold,
              style: "normal",
              weight: 600,
            },
          ]
        : undefined,
    }
  );
}
