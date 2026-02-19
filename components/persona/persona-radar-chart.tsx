"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import {
  BookOpen,
  FileText,
  Clock,
  Users,
  Radar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona, ReadingPace, NoteStyle, ActivityPattern, GroupEngagement } from "@/types/persona";

interface PersonaRadarChartProps {
  persona: UserPersona | null;
  /** 애니메이션 활성화 */
  animated?: boolean;
  /** 컴팩트 모드 */
  compact?: boolean;
  className?: string;
}

// 각 특성의 수치 변환
const PACE_VALUES: Record<ReadingPace, number> = {
  fast: 100,
  steady: 60,
  slow: 30,
};

const STYLE_VALUES: Record<NoteStyle, number> = {
  "quote-focused": 80,
  "reflection-focused": 90,
  visual: 70,
  balanced: 100,
};

const PATTERN_VALUES: Record<ActivityPattern, number> = {
  morning: 70,
  afternoon: 60,
  evening: 80,
  night: 90,
};

const ENGAGEMENT_VALUES: Record<GroupEngagement, number> = {
  leader: 100,
  active: 80,
  observer: 50,
  solo: 30,
};

// 특성 라벨 키
const TRAIT_LABEL_KEYS = {
  readingPace: "persona.readingPace",
  noteStyle: "persona.noteStyle",
  activityPattern: "persona.activityPattern",
  groupEngagement: "persona.groupEngagement",
} as const;

// 특성 아이콘
const TRAIT_ICONS = {
  readingPace: BookOpen,
  noteStyle: FileText,
  activityPattern: Clock,
  groupEngagement: Users,
};

// 특성 색상
const TRAIT_COLORS = {
  readingPace: "text-blue-500",
  noteStyle: "text-green-500",
  activityPattern: "text-orange-500",
  groupEngagement: "text-purple-500",
};

/**
 * 페르소나 레이더 차트 컴포넌트
 *
 * 4가지 독서 특성을 레이더 차트로 시각화합니다.
 * - 독서 속도 (Reading Pace)
 * - 기록 스타일 (Note Style)
 * - 활동 패턴 (Activity Pattern)
 * - 그룹 참여도 (Group Engagement)
 */
export function PersonaRadarChart({
  persona,
  animated = true,
  compact = false,
  className,
}: PersonaRadarChartProps) {
  const { t } = useTranslation();
  const TRAIT_LABELS = {
    readingPace: t("persona.readingPace"),
    noteStyle: t("persona.noteStyle"),
    activityPattern: t("persona.activityPattern"),
    groupEngagement: t("persona.groupEngagement"),
  };

  // 특성값 계산
  const traits = useMemo(() => {
    if (!persona) {
      return {
        readingPace: 50,
        noteStyle: 50,
        activityPattern: 50,
        groupEngagement: 50,
      };
    }

    return {
      readingPace: persona.reading_pace
        ? PACE_VALUES[persona.reading_pace as ReadingPace]
        : 50,
      noteStyle: persona.note_style
        ? STYLE_VALUES[persona.note_style as NoteStyle]
        : 50,
      activityPattern: persona.activity_pattern
        ? PATTERN_VALUES[persona.activity_pattern as ActivityPattern]
        : 50,
      groupEngagement: persona.group_engagement
        ? ENGAGEMENT_VALUES[persona.group_engagement as GroupEngagement]
        : 50,
    };
  }, [persona]);

  // 평균 점수
  const averageScore = useMemo(() => {
    return Math.round(
      (traits.readingPace + traits.noteStyle + traits.activityPattern + traits.groupEngagement) / 4
    );
  }, [traits]);

  // 레이더 차트 좌표 계산
  const chartSize = compact ? 120 : 180;
  const center = chartSize / 2;
  const maxRadius = center - 20;

  const getPointPosition = (value: number, angle: number) => {
    const radius = (value / 100) * maxRadius;
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian),
    };
  };

  const traitKeys = ["readingPace", "noteStyle", "activityPattern", "groupEngagement"] as const;
  const angles = [0, 90, 180, 270];

  // 폴리곤 포인트 생성
  const polygonPoints = traitKeys.map((key, i) => {
    const pos = getPointPosition(traits[key], angles[i]);
    return `${pos.x},${pos.y}`;
  }).join(" ");

  // 배경 폴리곤 포인트 (그리드)
  const gridLevels = [25, 50, 75, 100];

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* 미니 레이더 */}
            <div className="relative">
              <svg width={chartSize} height={chartSize} className="overflow-visible">
                {/* 배경 그리드 */}
                {gridLevels.map((level) => (
                  <polygon
                    key={level}
                    points={traitKeys.map((_, i) => {
                      const pos = getPointPosition(level, angles[i]);
                      return `${pos.x},${pos.y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-slate-700"
                  />
                ))}

                {/* 축 */}
                {angles.map((angle, i) => {
                  const pos = getPointPosition(100, angle);
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={pos.x}
                      y2={pos.y}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-slate-200 dark:text-slate-700"
                    />
                  );
                })}

                {/* 데이터 폴리곤 */}
                <motion.polygon
                  points={polygonPoints}
                  fill="currentColor"
                  fillOpacity="0.2"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-primary"
                  initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />

                {/* 데이터 포인트 */}
                {traitKeys.map((key, i) => {
                  const pos = getPointPosition(traits[key], angles[i]);
                  return (
                    <motion.circle
                      key={key}
                      cx={pos.x}
                      cy={pos.y}
                      r="4"
                      fill="currentColor"
                      className="text-primary"
                      initial={animated ? { scale: 0 } : undefined}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    />
                  );
                })}
              </svg>

              {/* 중앙 점수 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-lg font-bold">{averageScore}</span>
                </div>
              </div>
            </div>

            {/* 특성 목록 */}
            <div className="flex-1 space-y-1">
              {traitKeys.map((key) => {
                const Icon = TRAIT_ICONS[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Icon className={cn("h-3 w-3", TRAIT_COLORS[key])} />
                    <span className="text-xs text-muted-foreground">{TRAIT_LABELS[key]}</span>
                    <span className="text-xs font-medium ml-auto">{traits[key]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            {t("persona.radarTitle")}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {t("persona.averageScore", { score: averageScore })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 레이더 차트 */}
        <div className="flex justify-center">
          <div className="relative">
            <svg width={chartSize} height={chartSize} className="overflow-visible">
              {/* 배경 그리드 */}
              {gridLevels.map((level) => (
                <polygon
                  key={level}
                  points={traitKeys.map((_, i) => {
                    const pos = getPointPosition(level, angles[i]);
                    return `${pos.x},${pos.y}`;
                  }).join(" ")}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-700"
                />
              ))}

              {/* 축 */}
              {angles.map((angle, i) => {
                const pos = getPointPosition(100, angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={pos.x}
                    y2={pos.y}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-slate-200 dark:text-slate-700"
                  />
                );
              })}

              {/* 데이터 폴리곤 */}
              <motion.polygon
                points={polygonPoints}
                fill="currentColor"
                fillOpacity="0.15"
                stroke="currentColor"
                strokeWidth="2"
                className="text-primary"
                initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              />

              {/* 데이터 포인트 */}
              {traitKeys.map((key, i) => {
                const pos = getPointPosition(traits[key], angles[i]);
                return (
                  <motion.circle
                    key={key}
                    cx={pos.x}
                    cy={pos.y}
                    r="5"
                    fill="currentColor"
                    className="text-primary"
                    initial={animated ? { scale: 0 } : undefined}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                  />
                );
              })}

              {/* 라벨 */}
              {traitKeys.map((key, i) => {
                const pos = getPointPosition(115, angles[i]);
                const Icon = TRAIT_ICONS[key];
                return (
                  <g key={`label-${key}`}>
                    <foreignObject
                      x={pos.x - 30}
                      y={pos.y - 12}
                      width="60"
                      height="24"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Icon className={cn("h-3 w-3", TRAIT_COLORS[key])} />
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {TRAIT_LABELS[key]}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* 특성 상세 */}
        <div className="grid grid-cols-2 gap-3">
          {traitKeys.map((key) => {
            const Icon = TRAIT_ICONS[key];
            const value = traits[key];

            return (
              <div
                key={key}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
              >
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center",
                  "bg-white dark:bg-slate-800"
                )}>
                  <Icon className={cn("h-4 w-4", TRAIT_COLORS[key])} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{TRAIT_LABELS[key]}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          key === "readingPace" && "bg-blue-500",
                          key === "noteStyle" && "bg-green-500",
                          key === "activityPattern" && "bg-orange-500",
                          key === "groupEngagement" && "bg-purple-500"
                        )}
                        initial={animated ? { width: 0 } : undefined}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{value}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 페르소나 비교 차트 컴포넌트
 * 두 시점의 페르소나를 비교합니다.
 */
interface PersonaCompareChartProps {
  currentPersona: UserPersona | null;
  previousPersona: UserPersona | null;
  className?: string;
}

export function PersonaCompareChart({
  currentPersona,
  previousPersona,
  className,
}: PersonaCompareChartProps) {
  const { t } = useTranslation();
  const TRAIT_LABELS = {
    readingPace: t("persona.readingPace"),
    noteStyle: t("persona.noteStyle"),
    activityPattern: t("persona.activityPattern"),
    groupEngagement: t("persona.groupEngagement"),
  };
  const traitKeys = ["readingPace", "noteStyle", "activityPattern", "groupEngagement"] as const;

  const getTraitValue = (persona: UserPersona | null, key: typeof traitKeys[number]) => {
    if (!persona) return 50;
    switch (key) {
      case "readingPace":
        return persona.reading_pace ? PACE_VALUES[persona.reading_pace as ReadingPace] : 50;
      case "noteStyle":
        return persona.note_style ? STYLE_VALUES[persona.note_style as NoteStyle] : 50;
      case "activityPattern":
        return persona.activity_pattern ? PATTERN_VALUES[persona.activity_pattern as ActivityPattern] : 50;
      case "groupEngagement":
        return persona.group_engagement ? ENGAGEMENT_VALUES[persona.group_engagement as GroupEngagement] : 50;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("persona.traitChange")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {traitKeys.map((key) => {
          const Icon = TRAIT_ICONS[key];
          const current = getTraitValue(currentPersona, key);
          const previous = getTraitValue(previousPersona, key);
          const change = current - previous;

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", TRAIT_COLORS[key])} />
                  <span className="text-sm">{TRAIT_LABELS[key]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{current}</span>
                  {change !== 0 && (
                    <Badge
                      variant={change > 0 ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] px-1.5",
                        change > 0 && "bg-emerald-500",
                        change < 0 && "bg-rose-500"
                      )}
                    >
                      {change > 0 ? "+" : ""}{change}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                {/* 이전 값 (회색) */}
                <div
                  className="absolute h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                  style={{ width: `${previous}%` }}
                />
                {/* 현재 값 */}
                <motion.div
                  className={cn(
                    "absolute h-full rounded-full",
                    key === "readingPace" && "bg-blue-500",
                    key === "noteStyle" && "bg-green-500",
                    key === "activityPattern" && "bg-orange-500",
                    key === "groupEngagement" && "bg-purple-500"
                  )}
                  initial={{ width: `${previous}%` }}
                  animate={{ width: `${current}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
