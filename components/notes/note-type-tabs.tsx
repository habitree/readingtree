"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NoteType } from "@/types/note";
import { useTranslation } from "@/lib/i18n";

interface NoteTypeTabsProps {
  value: NoteType;
  onValueChange: (value: NoteType) => void;
}

/**
 * 기록 유형 탭 컴포넌트
 */
export function NoteTypeTabs({ value, onValueChange }: NoteTypeTabsProps) {
  const { t } = useTranslation();
  return (
    <Tabs value={value} onValueChange={onValueChange as (value: string) => void}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="quote">{t("notes.quoteTab")}</TabsTrigger>
        <TabsTrigger value="transcription">{t("notes.transcriptionTab")}</TabsTrigger>
        <TabsTrigger value="photo">{t("notes.photoTab")}</TabsTrigger>
        <TabsTrigger value="memo">{t("notes.memoTab")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

