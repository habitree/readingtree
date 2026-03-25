import {
  Quote,
  Camera,
  FileText,
  ScanText,
} from "lucide-react";
import type { ElementType } from "react";

export type NoteStyleType = "quote" | "photo" | "memo" | "transcription";

export interface NoteTypeStyle {
  icon: ElementType;
  labelKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  /** SharedNotesList 그룹 내 기록 아이템용 wrapper 클래스 */
  wrapperClass: string;
}

/**
 * 기록 타입별 스타일 설정 (공통)
 * - group-note-card, group-note-feed, shared-notes-list에서 공유
 */
export const NOTE_TYPE_STYLES: Record<NoteStyleType, NoteTypeStyle> = {
  quote: {
    icon: Quote,
    labelKey: "groups.noteTypeQuote",
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-l-amber-400",
    wrapperClass:
      "border-l-2 border-amber-400 pl-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-md py-2 pr-3",
  },
  photo: {
    icon: Camera,
    labelKey: "groups.noteTypePhoto",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-l-blue-400",
    wrapperClass: "pl-3 py-2",
  },
  memo: {
    icon: FileText,
    labelKey: "groups.noteTypeMemo",
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-l-green-400",
    wrapperClass: "bg-muted/40 rounded-md pl-3 py-2 pr-3",
  },
  transcription: {
    icon: ScanText,
    labelKey: "groups.noteTypeTranscription",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-l-purple-400",
    wrapperClass:
      "border-l-2 border-purple-400 pl-3 bg-purple-50/30 dark:bg-purple-950/10 rounded-r-md py-2 pr-3",
  },
} as const;

/** 필터용 타입 정의 (all 포함) */
export type NoteFilterType = NoteStyleType | "all";
