"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NoteType } from "@/types/note";

interface NoteTypeTabsProps {
  value: NoteType;
  onValueChange: (value: NoteType) => void;
}

/**
 * 기록 유형 탭 컴포넌트
 */
export function NoteTypeTabs({ value, onValueChange }: NoteTypeTabsProps) {
  return (
    <Tabs value={value} onValueChange={onValueChange as (value: string) => void}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="quote">인용구</TabsTrigger>
        <TabsTrigger value="transcription">사진 필사</TabsTrigger>
        <TabsTrigger value="photo">사진</TabsTrigger>
        <TabsTrigger value="memo">메모</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

