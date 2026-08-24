"use client";

/**
 * AI 리포트 생성 전 스타일 선택 화면
 *
 * 리포트 페이지 진입 즉시 자동 생성하던 흐름을
 * "이미지 카드 스타일 5종 중 간단 선택 → 생성 버튼"으로 바꾼다.
 * 각 스타일 카드에는 이 책의 실제 정보(제목·저자·표지)로 렌더한
 * 미니 미리보기(상단부 크롭)를 보여줘 한눈에 인지할 수 있게 한다.
 * 선택한 스타일로 생성된 리포트 본문이 표시된다.
 */

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SHARE_CARD_TEMPLATES } from "./templates";
import { ensureShareCardFonts } from "./share-card-fonts";
import { TemplateThumb } from "./template-scaled-view";
import type { ShareCardData } from "./templates/types";

interface ReportStylePickerProps {
  noteCount: number;
  selectedId: string;
  onSelect: (id: string) => void;
  onGenerate: () => void;
  /** 미리보기용 데이터 (리포트 생성 전 — 책 정보·통계만 채워진 상태) */
  previewData?: ShareCardData | null;
}

export function ReportStylePicker({
  noteCount,
  selectedId,
  onSelect,
  onGenerate,
  previewData,
}: ReportStylePickerProps) {
  // 미리보기 렌더에 필요한 서체 로드
  useEffect(() => {
    if (previewData) ensureShareCardFonts(SHARE_CARD_TEMPLATES.flatMap((t) => t.fonts));
  }, [previewData]);

  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8 space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-lg font-semibold">리포트 스타일 선택</h2>
        <p className="text-sm text-muted-foreground">
          선택한 스타일로 리포트가 만들어져요. 생성 후에도 바꿀 수 있어요.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {SHARE_CARD_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "rounded-lg border p-2.5 text-left transition-colors",
              t.id === selectedId
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "hover:bg-muted/60"
            )}
          >
            {previewData ? (
              <TemplateThumb template={t} data={previewData} height={140} />
            ) : (
              <span
                className="block h-2 w-8 rounded-full"
                style={{ backgroundColor: t.captureBg }}
                aria-hidden
              />
            )}
            <span className="mt-2 block text-sm font-medium leading-snug">{t.name}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground line-clamp-2">
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
