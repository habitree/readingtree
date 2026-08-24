"use client";

/**
 * AI 리포트 생성 전 스타일 선택 화면
 *
 * 리포트 페이지 진입 즉시 자동 생성하던 흐름을
 * "이미지 카드 스타일 5종 중 간단 선택 → 생성 버튼"으로 바꾼다.
 * 선택한 스타일은 생성 후 '이미지 카드' 다이얼로그의 기본 템플릿이 된다.
 * (AI 생성 자체는 기본 콘텐츠 템플릿을 사용 — 스타일은 공유 카드의 시각 표현)
 */

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SHARE_CARD_TEMPLATES } from "./templates";

interface ReportStylePickerProps {
  noteCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onGenerate: () => void;
}

export function ReportStylePicker({
  noteCount,
  selectedId,
  onSelect,
  onGenerate,
}: ReportStylePickerProps) {
  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-lg font-semibold">리포트 스타일 선택</h2>
        <p className="text-sm text-muted-foreground">
          완성된 리포트를 이미지 카드로 공유할 때 적용될 스타일이에요. 생성 후에도 바꿀 수
          있어요.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {SHARE_CARD_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              t.id === selectedId
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "hover:bg-muted/60"
            )}
          >
            <span
              className="block h-2 w-8 rounded-full mb-2"
              style={{ backgroundColor: t.captureBg }}
              aria-hidden
            />
            <span className="block text-sm font-medium leading-snug">{t.name}</span>
            <span className="mt-1 block text-[11px] leading-snug text-muted-foreground line-clamp-2">
              {t.tagline}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button size="lg" onClick={onGenerate} className="w-full sm:w-auto sm:min-w-64">
          <Sparkles className="h-4 w-4 mr-2" />
          AI 리포트 생성
        </Button>
        <p className="text-xs text-muted-foreground">
          기록 {noteCount}개를 분석해요 · 보통 15~30초 걸려요
        </p>
      </div>
    </div>
  );
}
