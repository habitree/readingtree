import { ImageResponse } from "next/og";

export const alt = "ReadTree - 독서 기록 및 공유 플랫폼";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const FONT_FAMILY = '"NotoSansKR", sans-serif';

export default async function Image() {
  const [fontResult, iconResult] = await Promise.allSettled([
    fetch(
      new URL("../public/fonts/NotoSansKR-SemiBold.otf", import.meta.url)
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
          flexDirection: "row",
          backgroundColor: "#0c1220",
          fontFamily: FONT_FAMILY,
          overflow: "hidden",
        }}
      >
        {/* 배경 그라데이션 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "radial-gradient(ellipse at 15% 80%, rgba(22, 163, 74, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 85% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(15, 23, 42, 0.9) 0%, transparent 100%)",
          }}
        />

        {/* 미세 도트 패턴 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "radial-gradient(rgba(34, 197, 94, 0.12) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* 좌측: 브랜드 + 설명 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 56px",
            width: "52%",
            gap: 24,
          }}
        >
          {/* 로고 + 브랜드명 */}
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {iconSrc ? (
              <img
                src={iconSrc}
                alt=""
                width={64}
                height={64}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 8px 24px -4px rgba(22, 163, 74, 0.4)",
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: "#16a34a",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2" />
                </svg>
              </div>
            )}
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontFamily: FONT_FAMILY,
              }}
            >
              ReadTree
            </div>
          </div>

          {/* 태그라인 */}
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#22c55e",
              lineHeight: 1.4,
              fontFamily: FONT_FAMILY,
            }}
          >
            나만의 독서 여정을 기록하고 공유하세요
          </div>

          {/* 설명 */}
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#94a3b8",
              lineHeight: 1.6,
              fontFamily: FONT_FAMILY,
            }}
          >
            책 관리, 독서 노트, AI 독서 도우미와 함께하는 독서 플랫폼
          </div>

          {/* 기능 태그 */}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "rgba(22, 163, 74, 0.15)", borderRadius: 20, border: "1px solid rgba(34, 197, 94, 0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", fontFamily: FONT_FAMILY }}>독서 기록</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "rgba(22, 163, 74, 0.15)", borderRadius: 20, border: "1px solid rgba(34, 197, 94, 0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M12 3l1.5 4.5H18l-3.5 2.5L16 14.5 12 12l-4 2.5 1.5-4.5L6 7.5h4.5z" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", fontFamily: FONT_FAMILY }}>AI 리포트</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", backgroundColor: "rgba(22, 163, 74, 0.15)", borderRadius: 20, border: "1px solid rgba(34, 197, 94, 0.25)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", fontFamily: FONT_FAMILY }}>독서 모임</span>
            </div>
          </div>

          {/* 하단 도메인 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <div style={{ width: 40, height: 1, backgroundColor: "#334155", borderRadius: 1 }} />
            <span style={{ fontSize: 14, color: "#475569", fontWeight: 600, fontFamily: FONT_FAMILY }}>readingtree.app</span>
          </div>
        </div>

        {/* 우측: 서비스 UI 미리보기 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "48%",
            padding: "40px 40px 40px 0",
            gap: 16,
          }}
        >
          {/* 상단: 독서 통계 카드 */}
          <div
            style={{
              display: "flex",
              gap: 12,
              width: "100%",
            }}
          >
            {/* 이번 달 독서 */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "16px 18px", backgroundColor: "rgba(30, 41, 59, 0.8)", borderRadius: 14, border: "1px solid rgba(51, 65, 85, 0.6)", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>3월 독서</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#22c55e", fontFamily: FONT_FAMILY }}>5</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>권</span>
              </div>
            </div>
            {/* 총 기록 */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "16px 18px", backgroundColor: "rgba(30, 41, 59, 0.8)", borderRadius: 14, border: "1px solid rgba(51, 65, 85, 0.6)", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>총 기록</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#38bdf8", fontFamily: FONT_FAMILY }}>42</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>개</span>
              </div>
            </div>
            {/* 연속 독서 */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "16px 18px", backgroundColor: "rgba(30, 41, 59, 0.8)", borderRadius: 14, border: "1px solid rgba(51, 65, 85, 0.6)", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>연속</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#f59e0b", fontFamily: FONT_FAMILY }}>7</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>일</span>
              </div>
            </div>
          </div>

          {/* 중간: 독서 기록 카드 */}
          <div style={{ display: "flex", width: "100%", padding: "18px 20px", backgroundColor: "rgba(30, 41, 59, 0.8)", borderRadius: 14, border: "1px solid rgba(51, 65, 85, 0.6)", gap: 16 }}>
            {/* 책 표지 플레이스홀더 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 72, height: 100, borderRadius: 8, background: "linear-gradient(145deg, #1e3a2f, #0f2520)", border: "1px solid rgba(34, 197, 94, 0.2)", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
            </div>
            {/* 기록 내용 */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 8, justifyContent: "center" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", fontFamily: FONT_FAMILY }}>명상록</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", fontFamily: FONT_FAMILY }}>마르쿠스 아우렐리우스</span>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 48, height: 3, borderRadius: 2, backgroundColor: "#22c55e" }} />
                <div style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: "#334155" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", fontFamily: FONT_FAMILY }}>60% 진행</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", fontFamily: FONT_FAMILY }}>p.142</span>
              </div>
            </div>
          </div>

          {/* 하단: 독서 캘린더 미니 */}
          <div style={{ display: "flex", flexDirection: "column", width: "100%", padding: "16px 18px", backgroundColor: "rgba(30, 41, 59, 0.8)", borderRadius: 14, border: "1px solid rgba(51, 65, 85, 0.6)", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", fontFamily: FONT_FAMILY }}>독서 캘린더</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#475569", fontFamily: FONT_FAMILY }}>2026.03</span>
            </div>
            {/* 캘린더 도트 그리드 (4주 x 7일) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {/* Week 1 */}
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
              </div>
              {/* Week 2 */}
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
              </div>
              {/* Week 3 */}
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
              </div>
              {/* Week 4 (partial) */}
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#1e293b" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#16a34a" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "#22c55e" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.3)" }} />
                <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "rgba(30, 41, 59, 0.3)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 상단 그린 악센트 라인 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a)",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: notoSansKrSemiBold
        ? [
            {
              name: "NotoSansKR",
              data: notoSansKrSemiBold,
              style: "normal" as const,
              weight: 600 as const,
            },
          ]
        : undefined,
    }
  );
}
