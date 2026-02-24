"use client";

import { useState, useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseUrlMetadata } from "@/app/actions/url-parser";

interface SourceInputProps {
  sourceType: string;
  sourceLabel: string;
  onSourceTypeChange: (value: string) => void;
  onSourceLabelChange: (value: string) => void;
}

function isUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

/**
 * 출처 입력 컴포넌트
 * URL 붙여넣기 시 자동으로 출처 타입·제목을 분석한다.
 */
export function SourceInput({
  sourceType,
  sourceLabel,
  onSourceTypeChange,
  onSourceLabelChange,
}: SourceInputProps) {
  const { t } = useTranslation();
  const [isParsing, startParsing] = useTransition();
  const [parseError, setParseError] = useState(false);

  const showParseButton = isUrl(sourceLabel) && !isParsing;

  const handleLabelChange = (value: string) => {
    setParseError(false);
    onSourceLabelChange(value);
  };

  const handleParse = () => {
    setParseError(false);
    startParsing(async () => {
      try {
        const meta = await parseUrlMetadata(sourceLabel.trim());
        onSourceTypeChange(meta.sourceType);
        onSourceLabelChange(meta.title);
      } catch {
        setParseError(true);
      }
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Select value={sourceType} onValueChange={onSourceTypeChange}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder={t("notes.sourceType")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">{t("notes.sourceYoutube")}</SelectItem>
            <SelectItem value="instagram">{t("notes.sourceInstagram")}</SelectItem>
            <SelectItem value="article">{t("notes.sourceArticle")}</SelectItem>
            <SelectItem value="other">{t("notes.sourceOther")}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={sourceLabel}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder={t("notes.sourcePlaceholder")}
          className="flex-1 h-9 text-xs"
          maxLength={200}
        />
        {(showParseButton || isParsing) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleParse}
            disabled={isParsing}
            className="h-9 px-2.5 shrink-0 text-xs"
          >
            {isParsing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5" />
            )}
            <span className="ml-1 hidden sm:inline">
              {isParsing ? t("notes.urlParsing") : t("notes.urlParseButton")}
            </span>
          </Button>
        )}
      </div>
      {parseError && (
        <p className="text-[11px] text-red-500 dark:text-red-400 pl-1">
          {t("notes.urlParseFailed")}
        </p>
      )}
      {!parseError && isUrl(sourceLabel) && !isParsing && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 pl-1">
          {t("notes.urlParseHint")}
        </p>
      )}
    </div>
  );
}
