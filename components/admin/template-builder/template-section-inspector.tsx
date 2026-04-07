"use client";

/**
 * 섹션 인스펙터 (우측 패널)
 * 선택된 섹션의 상세 설정을 편집
 */

import { AnimatePresence, motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Settings2, ChevronDown, ChevronRight, Trash2, Columns2, Rows2, Square } from "lucide-react";
import type {
  ReportTemplateSectionConfig,
  SectionType,
  SectionAIConfig,
  TemplateTone,
  TargetLength,
} from "@/types/ai/report-template";
import {
  SECTION_TYPE_LABELS,
  TONE_LABELS,
  LENGTH_LABELS,
  GRID_LAYOUT_LABELS,
} from "@/types/ai/report-template";

interface TemplateSectionInspectorProps {
  section: ReportTemplateSectionConfig | null;
  aiConfig: SectionAIConfig | null;
  templateTone: TemplateTone;
  templateLength: TargetLength;
  onUpdate: (key: SectionType, updates: Partial<ReportTemplateSectionConfig>) => void;
  onUpdateAI: (key: SectionType, config: Partial<SectionAIConfig>) => void;
  onRemove: (key: SectionType) => void;
}

export function TemplateSectionInspector({
  section,
  aiConfig,
  templateTone,
  templateLength,
  onUpdate,
  onUpdateAI,
  onRemove,
}: TemplateSectionInspectorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!section || !aiConfig) {
    return (
      <div className="w-80 border-l flex items-center justify-center p-6 text-center">
        <div>
          <Settings2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            캔버스에서 섹션을 선택하면<br />
            상세 설정을 편집할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  const gridIcons = {
    full: <Columns2 className="h-4 w-4" />,
    half: <Square className="h-4 w-4" />,
    tall: <Rows2 className="h-4 w-4" />,
  };

  return (
    <div className="w-80 border-l flex flex-col h-full">
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">섹션 설정</h3>
          <Badge variant="outline" className="text-xs mt-0.5">
            {SECTION_TYPE_LABELS[section.key]}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={section.key}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="p-4 space-y-5"
          >
            {/* 기본 설정 */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                기본
              </h4>
              <div className="space-y-1.5">
                <Label className="text-xs">섹션 제목</Label>
                <Input
                  value={section.title}
                  onChange={(e) => onUpdate(section.key, { title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">필수 섹션</Label>
                <Switch
                  checked={section.required}
                  onCheckedChange={(v) => onUpdate(section.key, { required: v })}
                />
              </div>
            </div>

            <Separator />

            {/* 프롬프트 */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI 프롬프트
              </h4>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">지시문</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {section.promptInstruction.length}자
                  </span>
                </div>
                <Textarea
                  value={section.promptInstruction}
                  onChange={(e) =>
                    onUpdate(section.key, { promptInstruction: e.target.value })
                  }
                  placeholder="이 섹션에 대한 AI 지시문을 작성하세요..."
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">최대 글자 수</Label>
                <Input
                  type="number"
                  value={section.maxLength ?? ""}
                  onChange={(e) =>
                    onUpdate(section.key, {
                      maxLength: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="제한 없음"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* 스타일 오버라이드 */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                스타일 오버라이드
              </h4>

              <div className="space-y-1.5">
                <Label className="text-xs">톤</Label>
                <Select
                  value={aiConfig.toneOverride}
                  onValueChange={(v) =>
                    onUpdateAI(section.key, {
                      toneOverride: v as SectionAIConfig["toneOverride"],
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">
                      상속 ({TONE_LABELS[templateTone]})
                    </SelectItem>
                    {(Object.entries(TONE_LABELS) as [TemplateTone, string][]).map(
                      ([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">길이</Label>
                <Select
                  value={aiConfig.lengthControl}
                  onValueChange={(v) =>
                    onUpdateAI(section.key, {
                      lengthControl: v as SectionAIConfig["lengthControl"],
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">
                      상속 ({LENGTH_LABELS[templateLength]})
                    </SelectItem>
                    {(Object.entries(LENGTH_LABELS) as [TargetLength, string][]).map(
                      ([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 레이아웃 */}
              <div className="space-y-1.5">
                <Label className="text-xs">그리드 레이아웃</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["half", "full", "tall"] as const).map((layout) => (
                    <button
                      key={layout}
                      onClick={() => onUpdateAI(section.key, { gridLayout: layout })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-md border-2 text-xs transition-colors ${
                        aiConfig.gridLayout === layout
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {gridIcons[layout]}
                      <span>{GRID_LAYOUT_LABELS[layout]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* 고급 설정 (접힘) */}
            <div>
              <button
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="flex items-center justify-between w-full"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  고급 설정
                </h4>
                {advancedOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {advancedOpen && (
              <div className="mt-3 space-y-3">
                {/* Temperature 오버라이드 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Temperature 오버라이드</Label>
                    <span className="text-[10px] text-muted-foreground">
                      {aiConfig.temperatureOverride ?? "기본값"}
                    </span>
                  </div>
                  <Slider
                    value={[aiConfig.temperatureOverride ?? 0.7]}
                    onValueChange={([v]) =>
                      onUpdateAI(section.key, { temperatureOverride: v })
                    }
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() =>
                      onUpdateAI(section.key, { temperatureOverride: null })
                    }
                  >
                    기본값 사용
                  </Button>
                </div>

                {/* 단어 수 범위 */}
                <div className="space-y-1.5">
                  <Label className="text-xs">단어 수 범위</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      value={aiConfig.minWordCount ?? ""}
                      onChange={(e) =>
                        onUpdateAI(section.key, {
                          minWordCount: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="최소"
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      value={aiConfig.maxWordCount ?? ""}
                      onChange={(e) =>
                        onUpdateAI(section.key, {
                          maxWordCount: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="최대"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* 예시 출력 */}
                <div className="space-y-1.5">
                  <Label className="text-xs">예시 출력 (참고용)</Label>
                  <Textarea
                    value={aiConfig.exampleOutput}
                    onChange={(e) =>
                      onUpdateAI(section.key, { exampleOutput: e.target.value })
                    }
                    placeholder="이 섹션의 이상적인 출력 예시를 작성하세요..."
                    rows={4}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
              )}
            </div>

            <Separator />

            {/* 삭제 */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={() => onRemove(section.key)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              이 섹션 삭제
            </Button>
          </motion.div>
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
}
