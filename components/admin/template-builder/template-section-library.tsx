"use client";

/**
 * 섹션 라이브러리 패널 (좌측)
 * 사용 가능한 섹션 타입을 표시하고 클릭/드래그로 캔버스에 추가
 */

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, Lightbulb, Quote, PenLine, Route, Sparkles,
  MessageSquare, CheckSquare, GitCompare, TrendingUp, Share2, Network,
  GripVertical,
} from "lucide-react";
import type { SectionType } from "@/types/ai/report-template";
import {
  SECTION_TYPE_LABELS,
  SECTION_TYPE_DESCRIPTIONS,
} from "@/types/ai/report-template";
import { SECTION_TYPE_REGISTRY } from "@/lib/ai/report-section-registry";
import { EARTH_TONE_COLORS } from "@/lib/utils/report-parser";
import type { ComponentType } from "react";

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  BookOpen, Lightbulb, Quote, PenLine, Route, Sparkles,
  MessageSquare, CheckSquare, GitCompare, TrendingUp, Share2, Network,
};

const ALL_SECTION_TYPES: SectionType[] = [
  "overview", "insights", "quotes", "thoughts", "journey", "summary",
  "discussion", "action_items", "comparison", "growth", "social_snippet", "concept_map",
];

interface LibraryBlockProps {
  sectionType: SectionType;
  onAdd: (type: SectionType) => void;
}

function LibraryBlock({ sectionType, onAdd }: LibraryBlockProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${sectionType}`,
    data: { type: "library", sectionType },
  });

  const registry = SECTION_TYPE_REGISTRY[sectionType];
  const Icon = ICON_MAP[registry.icon];
  const colors = EARTH_TONE_COLORS[registry.colorTheme];

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onAdd(sectionType)}
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-grab active:cursor-grabbing transition-colors hover:bg-accent/50 ${
        isDragging ? "opacity-40" : ""
      }`}
      style={{ borderLeftWidth: "3px", borderLeftColor: `var(--${registry.colorTheme}-500, currentColor)` }}
    >
      <div className={`shrink-0 p-1.5 rounded-md ${colors?.iconBg || ""}`}>
        {Icon && <Icon className={`h-4 w-4 ${colors?.iconColor || ""}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          {SECTION_TYPE_LABELS[sectionType]}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {SECTION_TYPE_DESCRIPTIONS[sectionType]}
        </p>
      </div>
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
    </motion.div>
  );
}

interface TemplateSectionLibraryProps {
  usedTypes: SectionType[];
  onAdd: (type: SectionType) => void;
}

export function TemplateSectionLibrary({ usedTypes, onAdd }: TemplateSectionLibraryProps) {
  const available = ALL_SECTION_TYPES.filter((t) => !usedTypes.includes(t));

  return (
    <div className="w-64 border-r flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="text-sm font-semibold">섹션 블록</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          클릭 또는 드래그하여 추가
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {available.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              모든 섹션이 추가되었습니다
            </p>
          ) : (
            available.map((type) => (
              <LibraryBlock key={type} sectionType={type} onAdd={onAdd} />
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-2 border-t">
        <Badge variant="secondary" className="text-xs w-full justify-center">
          {available.length}개 사용 가능
        </Badge>
      </div>
    </div>
  );
}
