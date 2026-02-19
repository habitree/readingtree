"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n";

/**
 * 한영 전환 토글 버튼
 * 테마 토글과 동일한 스타일
 */
export function LanguageToggle() {
  const { t, toggleLocale } = useTranslation();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 sm:h-10 sm:w-10 font-semibold text-xs"
          onClick={toggleLocale}
          aria-label={t("language.switchTo")}
        >
          {t("language.label")}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t("language.tooltip")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
