"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  ArrowRight,
  BookOpen,
  FileText,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserPersona } from "@/types/persona";
import {
  ReadingPaceLabels,
  NoteStyleLabels,
  ActivityPatternLabels,
  GroupEngagementLabels,
} from "@/types/persona";

interface PersonaSnapshot {
  date: string;
  persona: UserPersona;
}

interface PersonaEvolutionProps {
  /** 페르소나 히스토리 (오래된 순) */
  history: PersonaSnapshot[];
  /** 최대 표시할 스냅샷 수 */
  maxSnapshots?: number;
  className?: string;
}

// 특성 변화 메시지
const EVOLUTION_MESSAGES = {
  readingPace: {
    improved: "독서 속도가 빨라졌어요!",
    maintained: "꾸준한 독서 속도를 유지하고 있어요",
    declined: "독서 속도가 느려졌어요",
  },
  noteStyle: {
    improved: "기록이 더 깊어졌어요!",
    maintained: "기록 스타일을 잘 유지하고 있어요",
    declined: "기록 빈도가 줄었어요",
  },
  activityPattern: {
    improved: "활동 시간이 더 규칙적이에요!",
    maintained: "활동 패턴을 잘 유지하고 있어요",
    declined: "활동 시간이 불규칙해졌어요",
  },
  groupEngagement: {
    improved: "모임 참여도가 높아졌어요!",
    maintained: "모임 참여를 잘 유지하고 있어요",
    declined: "모임 참여가 줄었어요",
  },
};

// 특성 아이콘
const TRAIT_ICONS = {
  readingPace: BookOpen,
  noteStyle: FileText,
  activityPattern: Clock,
  groupEngagement: Users,
};

/**
 * 페르소나 진화 추적 컴포넌트
 *
 * 시간에 따른 독서 페르소나의 변화를 추적하고 시각화합니다.
 * 성장 마인드셋을 강화하기 위한 긍정적 피드백을 제공합니다.
 */
export function PersonaEvolution({
  history,
  maxSnapshots = 6,
  className,
}: PersonaEvolutionProps) {
  // 표시할 스냅샷 (최신 순)
  const displayHistory = useMemo(() => {
    return [...history].reverse().slice(0, maxSnapshots);
  }, [history, maxSnapshots]);

  // 가장 최근 변화 분석
  const recentChanges = useMemo(() => {
    if (history.length < 2) return null;

    const current = history[history.length - 1].persona;
    const previous = history[history.length - 2].persona;

    const changes: {
      trait: keyof typeof TRAIT_ICONS;
      current: string | null;
      previous: string | null;
      trend: "improved" | "maintained" | "declined";
    }[] = [];

    // 각 특성 비교
    if (current.reading_pace !== previous.reading_pace) {
      changes.push({
        trait: "readingPace",
        current: current.reading_pace,
        previous: previous.reading_pace,
        trend: current.reading_pace === "fast" ? "improved" : "declined",
      });
    }

    if (current.note_style !== previous.note_style) {
      changes.push({
        trait: "noteStyle",
        current: current.note_style,
        previous: previous.note_style,
        trend: current.note_style === "balanced" || current.note_style === "reflection-focused"
          ? "improved"
          : "maintained",
      });
    }

    if (current.activity_pattern !== previous.activity_pattern) {
      changes.push({
        trait: "activityPattern",
        current: current.activity_pattern,
        previous: previous.activity_pattern,
        trend: "maintained",
      });
    }

    if (current.group_engagement !== previous.group_engagement) {
      changes.push({
        trait: "groupEngagement",
        current: current.group_engagement,
        previous: previous.group_engagement,
        trend: current.group_engagement === "leader" || current.group_engagement === "active"
          ? "improved"
          : "declined",
      });
    }

    return changes;
  }, [history]);

  // 전체 성장 점수
  const growthScore = useMemo(() => {
    if (!recentChanges) return 0;
    return recentChanges.reduce((acc, change) => {
      if (change.trend === "improved") return acc + 1;
      if (change.trend === "declined") return acc - 1;
      return acc;
    }, 0);
  }, [recentChanges]);

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground text-center">
            아직 페르소나 히스토리가 없습니다.<br />
            분석을 진행하면 변화를 추적할 수 있어요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            페르소나 진화
          </CardTitle>
          <Badge
            variant={growthScore > 0 ? "default" : growthScore < 0 ? "secondary" : "outline"}
            className={cn(
              "text-xs",
              growthScore > 0 && "bg-emerald-500",
              growthScore < 0 && "bg-rose-500"
            )}
          >
            {growthScore > 0 ? "성장 중" : growthScore < 0 ? "관리 필요" : "유지 중"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 최근 변화 요약 */}
        {recentChanges && recentChanges.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">최근 변화</h4>
            <div className="space-y-2">
              {recentChanges.map((change, index) => {
                const Icon = TRAIT_ICONS[change.trait];
                const TrendIcon =
                  change.trend === "improved" ? TrendingUp :
                  change.trend === "declined" ? TrendingDown : Minus;
                const trendColor =
                  change.trend === "improved" ? "text-emerald-500" :
                  change.trend === "declined" ? "text-rose-500" : "text-slate-400";

                return (
                  <motion.div
                    key={change.trait}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">
                        {EVOLUTION_MESSAGES[change.trait][change.trend]}
                      </p>
                    </div>
                    <TrendIcon className={cn("h-4 w-4", trendColor)} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* 타임라인 */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">진화 타임라인</h4>
          <div className="relative">
            {/* 타임라인 선 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

            <div className="space-y-3">
              {displayHistory.map((snapshot, index) => {
                const isLatest = index === 0;
                const date = new Date(snapshot.date);
                const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일`;

                return (
                  <motion.div
                    key={snapshot.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex items-start gap-4 pl-8"
                  >
                    {/* 타임라인 점 */}
                    <div
                      className={cn(
                        "absolute left-2.5 top-1 h-3 w-3 rounded-full border-2",
                        isLatest
                          ? "bg-primary border-primary"
                          : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      )}
                    />

                    {/* 내용 */}
                    <div
                      className={cn(
                        "flex-1 p-3 rounded-lg",
                        isLatest
                          ? "bg-primary/5 border border-primary/20"
                          : "bg-muted/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formattedDate}
                          </span>
                        </div>
                        {isLatest && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            현재
                          </Badge>
                        )}
                      </div>

                      {/* 페르소나 요약 */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-blue-500" />
                          <span className="text-muted-foreground">
                            {snapshot.persona.reading_pace
                              ? ReadingPaceLabels[snapshot.persona.reading_pace as keyof typeof ReadingPaceLabels]
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3 text-green-500" />
                          <span className="text-muted-foreground">
                            {snapshot.persona.note_style
                              ? NoteStyleLabels[snapshot.persona.note_style as keyof typeof NoteStyleLabels]
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-orange-500" />
                          <span className="text-muted-foreground">
                            {snapshot.persona.activity_pattern
                              ? ActivityPatternLabels[snapshot.persona.activity_pattern as keyof typeof ActivityPatternLabels]
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-purple-500" />
                          <span className="text-muted-foreground">
                            {snapshot.persona.group_engagement
                              ? GroupEngagementLabels[snapshot.persona.group_engagement as keyof typeof GroupEngagementLabels]
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 성장 인사이트 */}
        {history.length >= 3 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium mb-1">성장 인사이트</p>
                <p className="text-[11px] text-muted-foreground">
                  {growthScore > 0
                    ? "꾸준히 성장하고 있어요! 이 페이스를 유지하면 더 깊은 독서 경험을 쌓을 수 있어요."
                    : growthScore < 0
                    ? "최근 독서 활동이 줄었어요. 작은 목표부터 다시 시작해보는 건 어떨까요?"
                    : "안정적인 독서 습관을 유지하고 있어요. 새로운 도전을 시작해볼 타이밍이에요!"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 페르소나 성장 요약 컴포넌트
 * 컴팩트한 성장 지표 표시
 */
interface PersonaGrowthSummaryProps {
  currentPersona: UserPersona | null;
  previousPersona: UserPersona | null;
  daysSinceLastAnalysis: number;
  className?: string;
  onAnalyze?: () => void;
}

export function PersonaGrowthSummary({
  currentPersona,
  previousPersona,
  daysSinceLastAnalysis,
  className,
  onAnalyze,
}: PersonaGrowthSummaryProps) {
  const needsAnalysis = daysSinceLastAnalysis >= 7;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center",
              needsAnalysis
                ? "bg-amber-100 dark:bg-amber-950/30"
                : "bg-emerald-100 dark:bg-emerald-950/30"
            )}>
              <Sparkles className={cn(
                "h-5 w-5",
                needsAnalysis ? "text-amber-500" : "text-emerald-500"
              )} />
            </div>
            <div>
              <p className="text-sm font-medium">페르소나 상태</p>
              <p className="text-xs text-muted-foreground">
                {needsAnalysis
                  ? `${daysSinceLastAnalysis}일 전 분석 - 업데이트 권장`
                  : `${daysSinceLastAnalysis}일 전 분석 - 최신 상태`}
              </p>
            </div>
          </div>

          {onAnalyze && (
            <Button
              variant={needsAnalysis ? "default" : "outline"}
              size="sm"
              onClick={onAnalyze}
            >
              분석하기
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {currentPersona && previousPersona && (
          <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-2">
            {(["readingPace", "noteStyle", "activityPattern", "groupEngagement"] as const).map((trait) => {
              const Icon = TRAIT_ICONS[trait];
              const current = currentPersona[trait === "readingPace" ? "reading_pace" :
                              trait === "noteStyle" ? "note_style" :
                              trait === "activityPattern" ? "activity_pattern" : "group_engagement"];
              const previous = previousPersona[trait === "readingPace" ? "reading_pace" :
                              trait === "noteStyle" ? "note_style" :
                              trait === "activityPattern" ? "activity_pattern" : "group_engagement"];
              const changed = current !== previous;

              return (
                <div key={trait} className="text-center">
                  <div className={cn(
                    "h-8 w-8 rounded-full mx-auto flex items-center justify-center mb-1",
                    changed ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4",
                      changed ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  {changed && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] text-primary font-medium"
                    >
                      변화
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
