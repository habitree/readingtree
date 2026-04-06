"use client";

import { TimelineItem } from "./timeline-item";
import type { NoteWithBook } from "@/types/note";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";

interface TimelineGroupProps {
  month: string;
  notes: NoteWithBook[];
}

/**
 * 타임라인 그룹 컴포넌트
 * 월별로 기록을 그룹화하여 표시
 */
export function TimelineGroup({ month, notes }: TimelineGroupProps) {
  const { locale } = useTranslation();
  // YYYY-MM 형식을 locale에 맞게 변환
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
  const formattedMonth = locale === "ko"
    ? format(date, "yyyy년 M월", { locale: ko })
    : format(date, "MMMM yyyy", { locale: enUS });

  return (
    <div className="space-y-4">
      <div className="sticky top-20 bg-background/95 backdrop-blur-sm py-3 z-10 border-b border-border/30">
        <h2 className="text-base font-semibold text-foreground/80">{formattedMonth}</h2>
      </div>
      <div className="space-y-4">
        {notes.map((note) => (
          <TimelineItem key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}

