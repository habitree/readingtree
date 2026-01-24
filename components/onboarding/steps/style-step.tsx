"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UIStyleKey } from "@/types/style";
import { UI_STYLES, STYLE_KEYS, DEFAULT_STYLE } from "@/types/style";

interface StyleStepProps {
  onNext: (data: { style: UIStyleKey }) => void;
  onBack: () => void;
  isLoading?: boolean;
}

/**
 * 스타일 테마 색상
 */
const STYLE_COLORS: Record<UIStyleKey, string> = {
  minimal: "from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900",
  warm: "from-orange-100 to-amber-200 dark:from-orange-900 dark:to-amber-900",
  professional: "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900",
  poetic: "from-violet-100 to-purple-200 dark:from-violet-900 dark:to-purple-900",
};

/**
 * 스타일 선택 하이라이트 색상
 */
const STYLE_HIGHLIGHT_COLORS: Record<UIStyleKey, string> = {
  minimal: "ring-zinc-500",
  warm: "ring-orange-500",
  professional: "ring-slate-500",
  poetic: "ring-violet-500",
};

/**
 * UI 스타일 선택 스텝
 * 사용자가 선호하는 UI 톤앤매너를 선택하는 단계
 */
export function StyleStep({ onNext, onBack, isLoading }: StyleStepProps) {
  const [selectedStyle, setSelectedStyle] = useState<UIStyleKey>(DEFAULT_STYLE);

  const handleSubmit = () => {
    onNext({ style: selectedStyle });
  };

  return (
    <div className="space-y-6">
      {/* 아이콘 및 설명 */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Palette className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">스타일</h2>
          <p className="text-sm text-muted-foreground mt-1">
            원하는 분위기를 선택하세요
          </p>
        </div>
      </div>

      {/* 스타일 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {STYLE_KEYS.map((key) => {
          const style = UI_STYLES[key];
          const isSelected = selectedStyle === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedStyle(key)}
              disabled={isLoading}
              className={cn(
                "relative p-4 rounded-xl text-left transition-all",
                "border-2 bg-gradient-to-br",
                STYLE_COLORS[key],
                isSelected
                  ? cn("ring-2", STYLE_HIGHLIGHT_COLORS[key], "border-transparent")
                  : "border-transparent hover:border-muted-foreground/20"
              )}
            >
              {/* 선택 체크 표시 */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              {/* 스타일 아이콘 */}
              <div className="text-2xl mb-2">{style.emoji}</div>

              {/* 스타일 이름 */}
              <div className="font-semibold text-sm mb-1">{style.name}</div>

              {/* 스타일 설명 */}
              <div className="text-xs text-muted-foreground mb-2">
                {style.description}
              </div>

              {/* 미리보기 텍스트 */}
              <div className="text-xs italic text-muted-foreground/80 truncate">
                "{style.preview}"
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 스타일 설명 */}
      <div className="text-center p-4 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{UI_STYLES[selectedStyle].name}</span> 스타일이 적용됩니다
        </p>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          이전
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "저장 중..." : "다음"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        스타일은 나중에 설정에서 변경할 수 있습니다
      </p>
    </div>
  );
}
