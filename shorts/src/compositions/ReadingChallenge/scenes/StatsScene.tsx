import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { brandColors, fonts } from "../../../config/brand";
import { StatCounter } from "../../../components/data/StatCounter";
import { ProgressBar } from "../../../components/data/ProgressBar";

interface StatsSceneProps {
  booksRead: number;
  booksGoal: number;
  totalPages: number;
  genres: Array<{ name: string; count: number }>;
}

/**
 * 통계 인포그래픽 씬 — 차트 애니메이션
 */
export const StatsScene: React.FC<StatsSceneProps> = ({
  booksRead,
  booksGoal,
  totalPages,
  genres,
}) => {
  const frame = useCurrentFrame();

  const genreOpacity = interpolate(frame, [80, 100], [0, 1], {
    extrapolateRight: "clamp",
  });

  const maxGenreCount = Math.max(...genres.map((g) => g.count));

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          width: 800,
        }}
      >
        {/* 메인 통계 */}
        <div style={{ display: "flex", gap: 60 }}>
          <StatCounter
            value={booksRead}
            suffix="권"
            label="읽은 책"
            startFrame={10}
          />
          <StatCounter
            value={totalPages}
            suffix=""
            label="총 페이지"
            startFrame={20}
          />
        </div>

        {/* 진행률 바 */}
        <div style={{ width: "100%", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontFamily: fonts.sans,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              목표 달성률
            </span>
            <span
              style={{
                fontSize: 18,
                fontFamily: fonts.english,
                color: brandColors.forest[400],
                fontWeight: 700,
              }}
            >
              {booksRead}/{booksGoal}
            </span>
          </div>
          <ProgressBar
            progress={booksRead / booksGoal}
            width={700}
            height={16}
            startFrame={40}
          />
        </div>

        {/* 장르 분포 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: genreOpacity,
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontFamily: fonts.sans,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
            }}
          >
            장르별 분포
          </span>
          {genres.map((genre, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontFamily: fonts.sans,
                  color: "rgba(255,255,255,0.7)",
                  width: 80,
                  textAlign: "right",
                }}
              >
                {genre.name}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(genre.count / maxGenreCount) * 100}%`,
                    height: "100%",
                    borderRadius: 5,
                    background: `linear-gradient(90deg, ${brandColors.forest[500]}, ${brandColors.forest[400]})`,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontFamily: fonts.english,
                  color: brandColors.forest[400],
                  fontWeight: 700,
                  width: 30,
                }}
              >
                {genre.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
