"use client";

import { useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SourceInputProps {
  sourceType: string;
  sourceLabel: string;
  onSourceTypeChange: (value: string) => void;
  onSourceLabelChange: (value: string) => void;
}

/**
 * 출처 입력 컴포넌트
 * 책 없이 기록할 때 출처 유형 + 이름 입력
 */
export function SourceInput({
  sourceType,
  sourceLabel,
  onSourceTypeChange,
  onSourceLabelChange,
}: SourceInputProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
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
          onChange={(e) => onSourceLabelChange(e.target.value)}
          placeholder={t("notes.sourcePlaceholder")}
          className="flex-1 h-9 text-xs"
          maxLength={200}
        />
      </div>
    </div>
  );
}
