"use client";

/**
 * 템플릿 프리뷰 패널
 * 구조 뷰(레이아웃만) 또는 콘텐츠 뷰(샘플 텍스트)를 표시
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, Lightbulb, Quote, PenLine, Route, Sparkles,
  MessageSquare, CheckSquare, GitCompare, TrendingUp, Share2, Network,
  LayoutGrid, FileText, X,
} from "lucide-react";
import type { ReportTemplateSectionConfig, SectionType } from "@/types/ai/report-template";
import { getSectionAIConfig, GRID_LAYOUT_CLASSES, TONE_LABELS, LENGTH_LABELS } from "@/types/ai/report-template";
import { SECTION_TYPE_REGISTRY } from "@/lib/ai/report-section-registry";
import { EARTH_TONE_COLORS } from "@/lib/utils/report-parser";
import type { ComponentType } from "react";
import type { TemplateTone, TargetLength } from "@/types/ai/report-template";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen, Lightbulb, Quote, PenLine, Route, Sparkles,
  MessageSquare, CheckSquare, GitCompare, TrendingUp, Share2, Network,
  FileText,
};

/** 섹션별 샘플 콘텐츠 */
const SAMPLE_CONTENT: Partial<Record<SectionType, string>> = {
  overview: "이 책은 자기계발 분야의 대표작으로, 습관의 힘과 변화의 과학을 다룹니다. 2024년 3월부터 4월까지 약 한 달간 읽었습니다.",
  insights: "**1. 작은 습관의 복리 효과** - 매일 1%의 개선이 1년 후 37배의 성장을 만듭니다.\n\n**2. 환경 설계의 중요성** - 의지력보다 환경을 바꾸는 것이 효과적입니다.",
  quotes: "> \"우리는 반복하는 것으로 만들어진다. 그러므로 탁월함은 행위가 아니라 습관이다.\"\n> — p.23",
  thoughts: "이 책을 읽으면서 나의 아침 루틴을 다시 돌아보게 되었다. 특히 '습관 쌓기' 개념이 인상적이었는데...",
  summary: "이 책은 습관이 우리의 정체성을 형성한다는 핵심 메시지를 전달합니다. 작은 변화의 힘을 믿고 시스템을 구축하는 것이 목표 달성의 열쇠입니다.",
};

interface TemplatePreviewProps {
  sections: ReportTemplateSectionConfig[];
  mode: "structure" | "content";
  tone: TemplateTone;
  targetLength: TargetLength;
  templateName: string;
  onClose: () => void;
  onModeChange: (mode: "structure" | "content") => void;
}

export function TemplatePreview({
  sections,
  mode,
  tone,
  targetLength,
  templateName,
  onClose,
  onModeChange,
}: TemplatePreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 z-30 bg-background flex flex-col"
    >
      {/* 프리뷰 헤더 */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">미리보기</h3>
          <Badge variant="outline">{templateName || "새 템플릿"}</Badge>
          <div className="flex gap-1 bg-muted rounded-md p-0.5">
            <button
              onClick={() => onModeChange("structure")}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                mode === "structure"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3 w-3 inline mr-1" />
              구조
            </button>
            <button
              onClick={() => onModeChange("content")}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                mode === "content"
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-3 w-3 inline mr-1" />
              콘텐츠
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {TONE_LABELS[tone]} · {LENGTH_LABELS[targetLength]}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 프리뷰 본문 */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto">
          {/* 히어로 헤더 모의 */}
          <div className="rounded-xl bg-gradient-to-br from-stone-100 via-amber-50 to-orange-50 dark:from-stone-900 dark:via-amber-950 dark:to-orange-950 border p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-24 rounded-lg bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-stone-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold">샘플 도서</h2>
                <p className="text-sm text-muted-foreground">작가 이름</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">12개 기록 기반</Badge>
                  <Badge variant="outline" className="text-xs">완독</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* 벤토 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sections.map((section) => {
              const registry = SECTION_TYPE_REGISTRY[section.key];
              const Icon = ICON_MAP[registry.icon];
              const colors = EARTH_TONE_COLORS[registry.colorTheme];
              const aiConfig = getSectionAIConfig(section.config);
              const gridClass = GRID_LAYOUT_CLASSES[aiConfig.gridLayout];
              const sampleText = SAMPLE_CONTENT[section.key];

              return (
                <Card
                  key={section.key}
                  className={`overflow-hidden border ${colors?.border || ""} ${colors?.bg || ""} ${gridClass}`}
                >
                  <div className="p-4">
                    {/* 섹션 헤더 */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`p-1.5 rounded-md ${colors?.iconBg || ""}`}>
                        {Icon && <Icon className={`h-4 w-4 ${colors?.iconColor || ""}`} />}
                      </div>
                      <h3 className="text-sm font-semibold">{section.title}</h3>
                    </div>

                    {/* 내용 */}
                    {mode === "content" && sampleText ? (
                      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {sampleText}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="h-3 bg-muted/60 rounded w-full" />
                        <div className="h-3 bg-muted/60 rounded w-4/5" />
                        <div className="h-3 bg-muted/60 rounded w-3/5" />
                        {aiConfig.gridLayout === "tall" && (
                          <>
                            <div className="h-3 bg-muted/60 rounded w-full mt-2" />
                            <div className="h-3 bg-muted/60 rounded w-2/3" />
                          </>
                        )}
                      </div>
                    )}

                    {/* 설정 오버라이드 표시 */}
                    {(aiConfig.toneOverride !== "inherit" ||
                      aiConfig.lengthControl !== "inherit") && (
                      <div className="flex gap-1 mt-3">
                        {aiConfig.toneOverride !== "inherit" && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            {TONE_LABELS[aiConfig.toneOverride]}
                          </Badge>
                        )}
                        {aiConfig.lengthControl !== "inherit" && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            {LENGTH_LABELS[aiConfig.lengthControl]}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}
