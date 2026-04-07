"use client";

/**
 * 비주얼 템플릿 빌더 메인 컴포넌트
 * DndContext로 라이브러리→캔버스 드롭 + 캔버스 내 정렬을 통합 관리
 */

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useTemplateBuilder } from "./use-template-builder";
import { TemplateBuilderTopBar } from "./template-builder-top-bar";
import { TemplateSectionLibrary } from "./template-section-library";
import { TemplateCanvas } from "./template-canvas";
import { TemplateSectionInspector } from "./template-section-inspector";
import { TemplatePreview } from "./template-preview";
import type { ReportTemplate, SectionType } from "@/types/ai/report-template";
import { SECTION_TYPE_LABELS } from "@/types/ai/report-template";
import { SECTION_TYPE_REGISTRY } from "@/lib/ai/report-section-registry";
import { EARTH_TONE_COLORS } from "@/lib/utils/report-parser";

interface TemplateBuilderProps {
  template: ReportTemplate | null;
  onSave: (data: ReportTemplate) => Promise<void>;
  onClose: () => void;
}

export function TemplateBuilder({ template, onSave, onClose }: TemplateBuilderProps) {
  const { state, dispatch, selectedSection, selectedAIConfig, toTemplate } =
    useTemplateBuilder(template);
  const [saving, setSaving] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // dnd-kit 센서
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 드래그 시작
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  // 드래그 종료
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;

      // 라이브러리 → 캔버스 드롭
      if (activeId.startsWith("library-")) {
        const sectionType = activeId.replace("library-", "") as SectionType;
        dispatch({ type: "ADD_SECTION", sectionType });
        return;
      }

      // 캔버스 내 재정렬
      const overId = over.id as string;
      if (activeId !== overId) {
        const oldIndex = state.sections.findIndex((s) => s.key === activeId);
        const newIndex = state.sections.findIndex((s) => s.key === overId);
        if (oldIndex !== -1 && newIndex !== -1) {
          dispatch({ type: "REORDER_SECTIONS", fromIndex: oldIndex, toIndex: newIndex });
        }
      }
    },
    [state.sections, dispatch]
  );

  // 저장
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(toTemplate());
      dispatch({ type: "MARK_SAVED" });
    } finally {
      setSaving(false);
    }
  };

  // 사용 중인 섹션 타입
  const usedTypes = state.sections.map((s) => s.key);

  // 드래그 오버레이용 아이템 정보
  const dragOverlayContent = activeDragId ? (() => {
    const isLibrary = activeDragId.startsWith("library-");
    const sectionType = isLibrary
      ? (activeDragId.replace("library-", "") as SectionType)
      : (activeDragId as SectionType);
    const registry = SECTION_TYPE_REGISTRY[sectionType];
    const colors = EARTH_TONE_COLORS[registry?.colorTheme];

    return (
      <div className={`px-3 py-2 rounded-lg border-2 border-primary shadow-lg ${colors?.bg || "bg-background"}`}>
        <Badge variant="outline" className="text-xs">
          {SECTION_TYPE_LABELS[sectionType]}
        </Badge>
      </div>
    );
  })() : null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* 상단 바 */}
      <TemplateBuilderTopBar
        state={state}
        saving={saving}
        onSetMeta={(field, value) => dispatch({ type: "SET_META", field, value })}
        onSetTone={(value) => dispatch({ type: "SET_TONE", value })}
        onSetLength={(value) => dispatch({ type: "SET_LENGTH", value })}
        onSetToggle={(field, value) => dispatch({ type: "SET_TOGGLE", field, value })}
        onTogglePreview={() => dispatch({ type: "TOGGLE_PREVIEW" })}
        onSave={handleSave}
        onClose={onClose}
      />

      {/* 3패널 본문 */}
      <div className="flex-1 flex overflow-hidden relative">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* 좌측: 섹션 라이브러리 */}
          <TemplateSectionLibrary
            usedTypes={usedTypes}
            onAdd={(type) => dispatch({ type: "ADD_SECTION", sectionType: type })}
          />

          {/* 중앙: 캔버스 */}
          <TemplateCanvas
            sections={state.sections}
            selectedKey={state.selectedSectionKey}
            onSelect={(key) => dispatch({ type: "SELECT_SECTION", key })}
            onRemove={(key) => dispatch({ type: "REMOVE_SECTION", sectionType: key })}
          />

          {/* 드래그 오버레이 */}
          <DragOverlay>{dragOverlayContent}</DragOverlay>
        </DndContext>

        {/* 우측: 인스펙터 */}
        <TemplateSectionInspector
          section={selectedSection}
          aiConfig={selectedAIConfig}
          templateTone={state.tone}
          templateLength={state.targetLength}
          onUpdate={(key, updates) =>
            dispatch({ type: "UPDATE_SECTION", key, updates })
          }
          onUpdateAI={(key, config) =>
            dispatch({ type: "UPDATE_SECTION_AI_CONFIG", key, config })
          }
          onRemove={(key) => dispatch({ type: "REMOVE_SECTION", sectionType: key })}
        />

        {/* 프리뷰 오버레이 */}
        <AnimatePresence>
          {state.showPreview && (
            <TemplatePreview
              sections={state.sections}
              mode={state.previewMode}
              tone={state.tone}
              targetLength={state.targetLength}
              templateName={state.name}
              onClose={() => dispatch({ type: "TOGGLE_PREVIEW", show: false })}
              onModeChange={(mode) => dispatch({ type: "SET_PREVIEW_MODE", mode })}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
