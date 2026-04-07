/**
 * 템플릿 빌더 상태 관리 리듀서
 */

import { useReducer, useCallback } from "react";
import type {
  ReportTemplate,
  ReportTemplateSectionConfig,
  SectionType,
  TemplateTone,
  TargetLength,
  TemplateStyle,
  SectionAIConfig,
} from "@/types/ai/report-template";
import {
  SECTION_TYPE_LABELS,
  DEFAULT_SECTION_AI_CONFIG,
  getSectionAIConfig,
  setSectionAIConfig,
} from "@/types/ai/report-template";

// ── State ───────────────────────────────────────────────
export interface BuilderState {
  // 템플릿 메타
  name: string;
  description: string;
  slug: string;
  style: TemplateStyle;
  tone: TemplateTone;
  targetLength: TargetLength;
  includeStats: boolean;
  multiReadAware: boolean;
  isDefault: boolean;
  isSystem: boolean;

  // 섹션 목록
  sections: ReportTemplateSectionConfig[];

  // UI 상태
  selectedSectionKey: SectionType | null;
  isDirty: boolean;
  previewMode: "structure" | "content";
  showPreview: boolean;
}

// ── Actions ─────────────────────────────────────────────
type BuilderAction =
  | { type: "SET_META"; field: keyof Pick<BuilderState, "name" | "description" | "slug">; value: string }
  | { type: "SET_STYLE"; value: TemplateStyle }
  | { type: "SET_TONE"; value: TemplateTone }
  | { type: "SET_LENGTH"; value: TargetLength }
  | { type: "SET_TOGGLE"; field: "includeStats" | "multiReadAware"; value: boolean }
  | { type: "ADD_SECTION"; sectionType: SectionType; atIndex?: number }
  | { type: "REMOVE_SECTION"; sectionType: SectionType }
  | { type: "REORDER_SECTIONS"; fromIndex: number; toIndex: number }
  | { type: "SELECT_SECTION"; key: SectionType | null }
  | { type: "UPDATE_SECTION"; key: SectionType; updates: Partial<ReportTemplateSectionConfig> }
  | { type: "UPDATE_SECTION_AI_CONFIG"; key: SectionType; config: Partial<SectionAIConfig> }
  | { type: "TOGGLE_PREVIEW"; show?: boolean }
  | { type: "SET_PREVIEW_MODE"; mode: "structure" | "content" }
  | { type: "MARK_SAVED" };

// ── Reducer ─────────────────────────────────────────────
function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "SET_META":
      return { ...state, [action.field]: action.value, isDirty: true };

    case "SET_STYLE":
      return { ...state, style: action.value, isDirty: true };

    case "SET_TONE":
      return { ...state, tone: action.value, isDirty: true };

    case "SET_LENGTH":
      return { ...state, targetLength: action.value, isDirty: true };

    case "SET_TOGGLE":
      return { ...state, [action.field]: action.value, isDirty: true };

    case "ADD_SECTION": {
      const exists = state.sections.some((s) => s.key === action.sectionType);
      if (exists) return state;

      const newSection: ReportTemplateSectionConfig = {
        key: action.sectionType,
        title: SECTION_TYPE_LABELS[action.sectionType],
        promptInstruction: "",
        maxLength: null,
        required: true,
        sortOrder: 0,
        config: { ...DEFAULT_SECTION_AI_CONFIG },
      };

      let sections: ReportTemplateSectionConfig[];
      if (action.atIndex !== undefined) {
        sections = [...state.sections];
        sections.splice(action.atIndex, 0, newSection);
      } else {
        sections = [...state.sections, newSection];
      }
      sections = sections.map((s, i) => ({ ...s, sortOrder: i + 1 }));

      return {
        ...state,
        sections,
        selectedSectionKey: action.sectionType,
        isDirty: true,
      };
    }

    case "REMOVE_SECTION": {
      const sections = state.sections
        .filter((s) => s.key !== action.sectionType)
        .map((s, i) => ({ ...s, sortOrder: i + 1 }));
      return {
        ...state,
        sections,
        selectedSectionKey:
          state.selectedSectionKey === action.sectionType ? null : state.selectedSectionKey,
        isDirty: true,
      };
    }

    case "REORDER_SECTIONS": {
      const sections = [...state.sections];
      const [moved] = sections.splice(action.fromIndex, 1);
      sections.splice(action.toIndex, 0, moved);
      return {
        ...state,
        sections: sections.map((s, i) => ({ ...s, sortOrder: i + 1 })),
        isDirty: true,
      };
    }

    case "SELECT_SECTION":
      return { ...state, selectedSectionKey: action.key };

    case "UPDATE_SECTION":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.key === action.key ? { ...s, ...action.updates } : s
        ),
        isDirty: true,
      };

    case "UPDATE_SECTION_AI_CONFIG":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.key === action.key
            ? { ...s, config: setSectionAIConfig(s.config, action.config) }
            : s
        ),
        isDirty: true,
      };

    case "TOGGLE_PREVIEW":
      return { ...state, showPreview: action.show ?? !state.showPreview };

    case "SET_PREVIEW_MODE":
      return { ...state, previewMode: action.mode };

    case "MARK_SAVED":
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// ── Initialize ──────────────────────────────────────────
export function initializeState(template: ReportTemplate | null): BuilderState {
  if (template) {
    return {
      name: template.name,
      description: template.description || "",
      slug: template.slug,
      style: template.style || "editorial",
      tone: template.tone,
      targetLength: template.targetLength,
      includeStats: template.includeStats,
      multiReadAware: template.multiReadAware,
      isDefault: template.isDefault,
      isSystem: template.isSystem,
      sections: template.sections.map((s) => ({
        ...s,
        config: s.config || { ...DEFAULT_SECTION_AI_CONFIG },
      })),
      selectedSectionKey: null,
      isDirty: false,
      previewMode: "structure",
      showPreview: false,
    };
  }

  return {
    name: "",
    description: "",
    slug: "",
    style: "editorial",
    tone: "friendly",
    targetLength: "medium",
    includeStats: true,
    multiReadAware: false,
    isDefault: false,
    isSystem: false,
    sections: [],
    selectedSectionKey: null,
    isDirty: false,
    previewMode: "structure",
    showPreview: false,
  };
}

// ── Hook ────────────────────────────────────────────────
export function useTemplateBuilder(template: ReportTemplate | null) {
  const [state, dispatch] = useReducer(builderReducer, template, initializeState);

  const selectedSection = state.selectedSectionKey
    ? state.sections.find((s) => s.key === state.selectedSectionKey) ?? null
    : null;

  const selectedAIConfig = selectedSection
    ? getSectionAIConfig(selectedSection.config)
    : null;

  const toTemplate = useCallback((): ReportTemplate => {
    return {
      id: template?.id || "",
      name: state.name,
      description: state.description || null,
      slug: state.slug,
      style: state.style,
      tone: state.tone,
      targetLength: state.targetLength,
      includeStats: state.includeStats,
      multiReadAware: state.multiReadAware,
      isDefault: state.isDefault,
      isSystem: state.isSystem,
      sortOrder: template?.sortOrder ?? 0,
      sections: state.sections,
      createdAt: template?.createdAt || "",
      updatedAt: template?.updatedAt || "",
    };
  }, [state, template]);

  return { state, dispatch, selectedSection, selectedAIConfig, toTemplate };
}
