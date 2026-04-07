"use client";

/**
 * 캔버스 내 정렬 가능한 섹션 카드
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Lightbulb, Quote, PenLine, Route, Sparkles,
  MessageSquare, CheckSquare, GitCompare, TrendingUp, Share2, Network,
  GripVertical, X, Star,
} from "lucide-react";
import type { ReportTemplateSectionConfig, SectionType } from "@/types/ai/report-template";
import { getSectionAIConfig, TONE_LABELS } from "@/types/ai/report-template";
import { SECTION_TYPE_REGISTRY } from "@/lib/ai/report-section-registry";
import { EARTH_TONE_COLORS } from "@/lib/utils/report-parser";
import type { ComponentType } from "react";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen, Lightbulb, Quote, PenLine, Route, Sparkles,
  MessageSquare, CheckSquare, GitCompare, TrendingUp, Share2, Network,
};

interface SortableCanvasCardProps {
  section: ReportTemplateSectionConfig;
  isSelected: boolean;
  onSelect: (key: SectionType) => void;
  onRemove: (key: SectionType) => void;
}

export function SortableCanvasCard({
  section,
  isSelected,
  onSelect,
  onRemove,
}: SortableCanvasCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const registry = SECTION_TYPE_REGISTRY[section.key];
  const Icon = ICON_MAP[registry.icon];
  const colors = EARTH_TONE_COLORS[registry.colorTheme];
  const aiConfig = getSectionAIConfig(section.config);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative rounded-lg border-2 p-3 cursor-pointer transition-all ${
        isDragging ? "opacity-50 shadow-lg z-50" : ""
      } ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 shadow-sm"
          : "border-border hover:border-primary/40"
      } ${colors?.bg || ""}`}
      onClick={() => onSelect(section.key)}
    >
      <div className="flex items-start gap-2.5">
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* 아이콘 */}
        <div className={`shrink-0 p-1.5 rounded-md ${colors?.iconBg || ""}`}>
          {Icon && <Icon className={`h-4 w-4 ${colors?.iconColor || ""}`} />}
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium truncate">{section.title}</span>
            {section.required && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
          </div>

          {/* 배지 */}
          <div className="flex flex-wrap gap-1 mt-1">
            {aiConfig.toneOverride !== "inherit" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {TONE_LABELS[aiConfig.toneOverride]}
              </Badge>
            )}
            {aiConfig.gridLayout !== "half" && (
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {aiConfig.gridLayout === "full" ? "전체폭" : "세로확장"}
              </Badge>
            )}
          </div>

          {/* 프롬프트 미리보기 */}
          {section.promptInstruction && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {section.promptInstruction}
            </p>
          )}
        </div>

        {/* 삭제 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(section.key);
          }}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 순서 번호 */}
      <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
        {section.sortOrder}
      </div>
    </motion.div>
  );
}
