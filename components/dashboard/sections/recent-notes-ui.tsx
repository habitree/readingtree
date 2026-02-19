"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { RecentNotes } from "../recent-notes";
import type { NoteWithBook } from "@/types/note";
import { useTranslation } from "@/lib/i18n";

interface RecentNotesUIProps {
  notes: NoteWithBook[];
}

/**
 * 최근 노트 섹션 UI (클라이언트 컴포넌트)
 * 번역을 위해 useTranslation 사용
 */
export function RecentNotesUI({ notes }: RecentNotesUIProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="mb-2">{t("dashboard.recentNotesTitle")}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {notes.length > 0 ? (
          <RecentNotes notes={notes} />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("dashboard.noRecords")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
