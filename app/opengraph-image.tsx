import { ImageResponse } from "next/og";

// 이미지 메타데이터
export const runtime = "edge";
export const alt = "ReadTree - 독서 기록 및 공유 플랫폼";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * 동적 Open Graph 이미지 생성
 * Next.js 13+ ImageResponse API 사용
 *
 * 디자인 컨셉:
 * - Forest 테마 색상 (숲 녹색 계열)
 * - 책과 나무를 연상시키는 심플한 디자인
 * - 브랜드 아이덴티티 강화
 */
export default async function Image() {
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
          backgroundColor: "#f0fdf4", // 연한 녹색 배경
          backgroundImage: "radial-gradient(circle at 25% 25%, #dcfce7 0%, transparent 50%), radial-gradient(circle at 75% 75%, #bbf7d0 0%, transparent 50%)",
        }}
      >
        {/* 장식적 요소 - 나무/잎 패턴 */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            opacity: 0.1,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            backgroundColor: "#16a34a",
            opacity: 0.1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 150,
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#4ade80",
            opacity: 0.15,
          }}
        />

        {/* 메인 컨텐츠 영역 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 60px",
            backgroundColor: "white",
            borderRadius: 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          {/* 로고 아이콘 - 책 + 나무 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 100,
              height: 100,
              borderRadius: 20,
              backgroundColor: "#16a34a",
              marginBottom: 24,
            }}
          >
            {/* 나무 아이콘 SVG */}
            {/* 나무 아이콘 */}
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: "white" }}
            >
              <path
                d="M12 22v-7M9 22h6M12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 5V2"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 브랜드 이름 */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: "#166534",
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            ReadTree
          </div>

          {/* 태그라인 */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#4b5563",
              textAlign: "center",
            }}
          >
            독서 기록 및 공유 플랫폼
          </div>

          {/* 부가 설명 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              marginTop: 32,
              fontSize: 18,
              color: "#6b7280",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              책 관리
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              독서 노트
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                }}
              />
              AI 도우미
            </div>
          </div>
        </div>

        {/* 하단 URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "#9ca3af",
            fontWeight: 500,
          }}
        >
          readtree.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
