"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UIStyleKey } from "@/types/style";
import { UI_STYLES, STYLE_KEYS } from "@/types/style";
import { setUIStyle } from "@/app/actions/onboarding";

interface StyleSelectorProps {
  currentStyle: UIStyleKey;
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
 * UI 스타일 선택기 컴포넌트
 * 설정 페이지에서 UI 톤앤매너를 변경할 수 있습니다
 */
export function StyleSelector({ currentStyle }: StyleSelectorProps) {
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState<UIStyleKey>(currentStyle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleStyleChange = (style: UIStyleKey) => {
    setSelectedStyle(style);
    setHasChanges(style !== currentStyle);
  };

  const handleSave = async () => {
    if (!hasChanges || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await setUIStyle(selectedStyle);
      toast.success("스타일이 변경되었습니다");
      setHasChanges(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "스타일 변경에 실패했습니다"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          <CardTitle>UI 스타일</CardTitle>
        </div>
        <CardDescription>
          앱의 말투와 분위기를 선택하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 스타일 카드 그리드 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {STYLE_KEYS.map((key) => {
            const style = UI_STYLES[key];
            const isSelected = selectedStyle === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleStyleChange(key)}
                disabled={isSubmitting}
                className={cn(
                  "relative p-3 sm:p-4 rounded-xl text-left transition-all",
                  "border-2 bg-gradient-to-br",
                  STYLE_COLORS[key],
                  isSelected
                    ? cn("ring-2", STYLE_HIGHLIGHT_COLORS[key], "border-transparent")
                    : "border-transparent hover:border-muted-foreground/20",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* 선택 체크 표시 */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* 스타일 아이콘 */}
                <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{style.emoji}</div>

                {/* 스타일 이름 */}
                <div className="font-semibold text-xs sm:text-sm mb-0.5 sm:mb-1">{style.name}</div>

                {/* 스타일 설명 */}
                <div className="text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
                  {style.description}
                </div>

                {/* 미리보기 텍스트 */}
                <div className="text-[10px] sm:text-xs italic text-muted-foreground/80 truncate">
                  "{style.preview}"
                </div>
              </button>
            );
          })}
        </div>

        {/* 저장 버튼 */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "스타일 변경 저장"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
