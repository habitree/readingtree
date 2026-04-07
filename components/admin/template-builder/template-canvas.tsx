"use client";

/**
 * 템플릿 캔버스 (중앙 패널)
 * dnd-kit SortableContext로 섹션 카드 재배열
 */

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutGrid, Plus } from "lucide-react";
import { SortableCanvasCard } from "./sortable-canvas-card";
import type { ReportTemplateSectionConfig, SectionType } from "@/types/ai/report-template";

interface TemplateCanvasProps {
  sections: ReportTemplateSectionConfig[];
  selectedKey: SectionType | null;
  onSelect: (key: SectionType | null) => void;
  onRemove: (key: SectionType) => void;
}

export function TemplateCanvas({
  sections,
  selectedKey,
  onSelect,
  onRemove,
}: TemplateCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop-zone" });

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">캔버스</h3>
          <span className="text-xs text-muted-foreground">
            ({sections.length}개 섹션)
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={`p-4 min-h-[400px] transition-colors ${
            isOver ? "bg-primary/5" : ""
          }`}
        >
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="text-sm font-medium mb-1">섹션을 추가하세요</h4>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                왼쪽 패널에서 섹션 블록을 클릭하거나
                드래그하여 리포트 구성을 시작하세요.
              </p>
            </div>
          ) : (
            <SortableContext
              items={sections.map((s) => s.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {sections.map((section) => (
                    <SortableCanvasCard
                      key={section.key}
                      section={section}
                      isSelected={selectedKey === section.key}
                      onSelect={onSelect}
                      onRemove={onRemove}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
