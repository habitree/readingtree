"use client";

import { useEffect, useState } from "react";
import { Sparkles, BookOpen, Brain, Lightbulb, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LOADING_STEPS = [
  { icon: BookOpen, label: "기록 불러오는 중", done: false },
  { icon: Brain, label: "AI 분석 중", done: false },
  { icon: Lightbulb, label: "인사이트 도출 중", done: false },
  { icon: FileText, label: "리포트 작성 중", done: false },
];

const ROTATING_MESSAGES = [
  "기록들을 꼼꼼히 읽고 있어요...",
  "독서 패턴을 분석하고 있어요...",
  "핵심 인사이트를 찾고 있어요...",
  "어떤 책이었는지 되새기고 있어요...",
  "나만의 독서 이야기를 만들고 있어요...",
  "좋은 문장들을 정리하고 있어요...",
  "독서 여정을 정리하고 있어요...",
  "거의 다 왔어요! 조금만 기다려 주세요...",
];

const TIPS = [
  "💡 기록이 많을수록 더 풍부한 리포트가 생성돼요",
  "📚 리포트는 저장 후 링크로 공유할 수 있어요",
  "✨ 인스타그램 공유용 카드 이미지도 다운받을 수 있어요",
  "🌱 ReadTree에서 독서 기록을 계속 쌓아보세요",
];

export function ReadingReportSkeleton() {
  const [messageIdx, setMessageIdx] = useState(0);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [stepProgress, setStepProgress] = useState(0);
  const [dots, setDots] = useState("");

  // 메시지 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // 단계 진행 애니메이션
  useEffect(() => {
    const timers = [
      setTimeout(() => setStepProgress(1), 800),
      setTimeout(() => setStepProgress(2), 4000),
      setTimeout(() => setStepProgress(3), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // 말줄임표 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* 메인 로딩 카드 */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-amber-50/50 to-orange-50/30 dark:from-primary/10 dark:via-amber-950/20 dark:to-orange-950/20 p-6">
        {/* 배경 글로우 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />

        <div className="relative space-y-5">
          {/* 상단: AI 아이콘 + 메시지 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">AI 독서 리포트 생성 중</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {ROTATING_MESSAGES[messageIdx]}
              </p>
            </div>
          </div>

          {/* 단계 진행 표시 */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LOADING_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isDone = stepProgress > i;
              const isActive = stepProgress === i;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-500",
                    isDone && "bg-primary/10 text-primary",
                    isActive && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                    !isDone && !isActive && "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-40" />
                  )}
                  <span className="truncate">{step.label}</span>
                  {isActive && (
                    <span className="shrink-0 w-4 text-left opacity-60">{dots}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 진행 바 */}
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-amber-400 to-primary rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${[15, 35, 65, 85][stepProgress] ?? 15}%`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite linear",
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground text-right">
              AI 분석은 보통 15~30초 정도 걸려요
            </p>
          </div>
        </div>
      </div>

      {/* 팁 배너 */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40">
        <span className="text-base shrink-0 mt-0.5">{TIPS[tipIdx].split(" ")[0]}</span>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          {TIPS[tipIdx].slice(TIPS[tipIdx].indexOf(" ") + 1)}
        </p>
      </div>

      {/* 스켈레톤 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {[
          { h: "40%", lines: 3 },
          { h: "40%", lines: 4 },
          { h: "30%", lines: 5 },
          { h: "30%", lines: 3 },
          { h: "25%", lines: 4 },
          { h: "25%", lines: 3 },
        ].map((card, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card/50 p-4 sm:p-5 space-y-3 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted" />
              <div className="h-4 w-28 bg-muted rounded" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: card.lines }).map((_, j) => (
                <div
                  key={j}
                  className="h-3 bg-muted rounded"
                  style={{ width: j === card.lines - 1 ? card.h : `${70 + (j % 3) * 10}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}
