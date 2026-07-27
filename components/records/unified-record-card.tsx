"use client";

/**
 * 통합 기록 카드 — 기록 기획 13 Phase 2
 *
 * 모든 입력 경로(시간세션·진행율 메모·스탬프·자유 상세)를 "있는 슬롯만" 적응형으로
 * 보여주는 단일 카드. 골격은 동일하고 종류는 작은 배지로만 구분(요구 4).
 * 카드 탭 = 해당 기록 "보기"(onView) — 과거 기록 열람·공유가 먼저, 편집은 보기에서 이어짐.
 * 우측 [편집] 버튼은 바로 편집으로 가는 지름길로 유지.
 *
 * reading-time-tab 의 행 레이아웃을 차용(책은 그룹 헤더에 있으므로 표지 대신 컴팩트 행).
 */

import Image from "next/image";
import {
  Timer,
  TrendingUp,
  FileText,
  StickyNote,
  PenTool,
  Camera,
  Images,
  Pencil,
  Trash2,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/duration";
import { formatSmartDate } from "@/lib/utils/date";
import { getImageUrl } from "@/lib/utils/image";
import { computeProgressPercent } from "@/lib/reading/progress";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import type { UnifiedRecord } from "@/types/unified-record";

interface UnifiedRecordCardProps {
  record: UnifiedRecord;
  /** 카드 본문 탭 — 읽기 전용 보기 시트 열기 */
  onView: (record: UnifiedRecord) => void;
  onEdit: (record: UnifiedRecord) => void;
  /** 삭제 요청 (피드가 확인 다이얼로그를 띄움) — 미지정 시 삭제 버튼 숨김 */
  onDelete?: (record: UnifiedRecord) => void;
  onOpenLightbox?: (urls: string[], alt: string) => void;
}

// 노트 타입별 아이콘 — 모듈 레벨 상수(렌더 중 컴포넌트 생성 방지)
const NOTE_TYPE_ICON: Record<string, LucideIcon> = {
  quote: FileText,
  memo: StickyNote,
  transcription: PenTool,
  photo: Camera,
  progress: TrendingUp,
};

/**
 * 종류별 색조(tone) — 앱 전반의 노트 타입 색상 컨벤션(design-tokens `backgrounds`)을 재사용.
 * 아이콘 칩 / 배지 / dot 을 한 팔레트로 묶어 감성 일관성을 확보한다.
 */
export type Tone = "primary" | "teal" | "emerald" | "blue" | "amber" | "purple" | "neutral";

export const TONE: Record<Tone, { chip: string; badge: string; dot: string }> = {
  primary: {
    chip: "bg-primary/10 text-primary ring-primary/15",
    badge: "bg-primary/10 text-primary",
    dot: "bg-primary",
  },
  teal: {
    chip: "bg-teal-50 text-teal-600 ring-teal-200/70 dark:bg-teal-950/40 dark:text-teal-400 dark:ring-teal-900/60",
    badge: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
    dot: "bg-teal-500",
  },
  emerald: {
    chip: "bg-emerald-50 text-emerald-600 ring-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900/60",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  blue: {
    chip: "bg-blue-50 text-blue-600 ring-blue-200/70 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900/60",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  amber: {
    chip: "bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900/60",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  purple: {
    chip: "bg-purple-50 text-purple-600 ring-purple-200/70 dark:bg-purple-950/40 dark:text-purple-400 dark:ring-purple-900/60",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
    dot: "bg-purple-500",
  },
  neutral: {
    chip: "bg-muted text-muted-foreground ring-border/60",
    badge: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
};

const NOTE_TYPE_TONE: Record<string, Tone> = {
  quote: "blue",
  memo: "amber",
  transcription: "purple",
  photo: "emerald",
  progress: "teal",
};

export function getKindStyle(record: UnifiedRecord): { label: string; tone: Tone } {
  switch (record.kind) {
    case "stamp":
      return { label: "스탬프", tone: "emerald" };
    case "progress":
      return { label: "진행", tone: "teal" };
    case "time":
      return { label: "시간", tone: "primary" };
    default: {
      const map: Record<string, string> = {
        quote: "구절",
        memo: "메모",
        transcription: "필사",
        photo: "사진",
      };
      const nt = record.noteType ?? "";
      return { label: map[nt] || "기록", tone: NOTE_TYPE_TONE[nt] ?? "neutral" };
    }
  }
}

/**
 * 종류별 아이콘 — 보기 시트(RecordViewSheet)와 공유.
 * 카드 본문은 아래처럼 식(expression)으로 인라인한다. 렌더 중 이 함수를 호출하면
 * react-hooks/static-components 규칙이 "컴포넌트를 렌더 중 생성"으로 잡기 때문.
 */
export function getKindIcon(record: UnifiedRecord): LucideIcon {
  if (record.kind === "time") return Timer;
  if (record.kind === "progress") return TrendingUp;
  if (record.kind === "stamp") return Camera;
  return NOTE_TYPE_ICON[record.noteType ?? "memo"] ?? BookOpen;
}

export function UnifiedRecordCard({ record, onView, onEdit, onDelete, onOpenLightbox }: UnifiedRecordCardProps) {
  const Icon: LucideIcon =
    record.kind === "time"
      ? Timer
      : record.kind === "progress"
        ? TrendingUp
        : record.kind === "stamp"
          ? Camera
          : NOTE_TYPE_ICON[record.noteType ?? "memo"] ?? BookOpen;
  const { label: kindLabel, tone } = getKindStyle(record);
  const toneStyle = TONE[tone];
  const hasImage = record.imageUrls.length > 0;
  const photoCount = record.imageUrls.length;

  const durationLabel =
    record.durationSeconds && record.durationSeconds > 0
      ? formatDuration(record.durationSeconds)
      : null;

  // 페이지/진행률 — 있는 것만
  let pagesLabel: string | null = null;
  if (record.source === "reading_log" && record.startPage != null && record.endPage != null) {
    pagesLabel = `p.${record.startPage}→${record.endPage}`;
  } else if (record.kind === "progress") {
    const pageNum = record.pageLabel ? parseInt(record.pageLabel, 10) : NaN;
    const percent = Number.isFinite(pageNum)
      ? computeProgressPercent(pageNum, record.book.totalPages)
      : null;
    pagesLabel = percent != null ? `${percent}%` : record.pageLabel ? `p.${record.pageLabel}` : null;
  } else if (record.pageLabel) {
    pagesLabel = `p.${record.pageLabel}`;
  }

  const showTitle = record.source === "note" && record.kind === "detail" && !!record.title;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(record)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(record);
        }
      }}
      aria-label="기록 자세히 보기"
      className={cn(
        "group flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-transparent cursor-pointer",
        "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:bg-muted/50 hover:border-border/50 hover:shadow-sm",
        "active:translate-y-0 active:shadow-none",
        "focus-visible:outline-none focus-visible:border-border/50 focus-visible:ring-2 focus-visible:ring-primary/25",
      )}
    >
      {/* 좌측: 사진 썸네일(라이트박스) 또는 종류 아이콘 */}
      {hasImage ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox?.(record.imageUrls, record.book.title ? `${record.book.title} 사진` : "기록 사진");
          }}
          className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-neutral-900 ring-1 ring-emerald-200 dark:ring-emerald-900 transition-transform active:scale-95"
          aria-label={photoCount > 1 ? `사진 ${photoCount}장 크게 보기` : "사진 크게 보기"}
        >
          <Image
            src={getImageUrl(record.imageUrls[0])}
            alt="기록 사진"
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
          {photoCount > 1 && (
            <span className="absolute bottom-0 right-0 inline-flex items-center gap-0.5 rounded-tl-md bg-emerald-600/90 px-1 text-[9px] font-bold tabular-nums text-white">
              <Images className="h-2 w-2" />
              {photoCount}
            </span>
          )}
        </button>
      ) : (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
            toneStyle.chip,
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      )}

      {/* 가운데: 메타 + 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {durationLabel && (
            <span className="text-sm font-semibold">{durationLabel}</span>
          )}
          {pagesLabel && (
            <span className="text-[11px] text-muted-foreground tabular-nums">{pagesLabel}</span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
              toneStyle.badge,
            )}
          >
            <span className={cn("h-1 w-1 rounded-full", toneStyle.dot)} aria-hidden />
            {kindLabel}
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground/50 shrink-0" suppressHydrationWarning>
            {formatSmartDate(record.createdAt)}
          </span>
        </div>

        {showTitle && (
          <h3 className="text-sm font-medium line-clamp-1 text-foreground/90 mt-1">
            {record.title}
          </h3>
        )}

        {/* 내용: 메모 또는 상세 content */}
        {record.kind === "detail" && record.content ? (
          <div className="mt-1">
            <NoteContentViewer content={record.content} pageNumber={null} maxLength={80} compact />
          </div>
        ) : record.kind === "detail" && record.transcriptionText ? (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {record.transcriptionText.length > 80
              ? record.transcriptionText.slice(0, 80) + "..."
              : record.transcriptionText}
          </p>
        ) : record.memo ? (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{record.memo}</p>
        ) : null}

        {/* 북마크 (다음 시작점) */}
        {record.bookmarkText && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <BookOpen className="h-3 w-3 shrink-0" />
            {record.bookmarkText}
          </p>
        )}
      </div>

      {/* 우측: 편집 / 삭제 */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(record);
          }}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="기록 편집"
        >
          <Pencil className="h-3 w-3" />
          편집
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(record);
            }}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            aria-label="기록 삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
