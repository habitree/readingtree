"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSmartDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { getNoteTypeLabel } from "@/lib/utils/note";
import { NoteContentViewer } from "@/components/notes/note-content-viewer";
import { OCRStatusBadge } from "@/components/notes/ocr-status-badge";
import { useOCRStatus } from "@/hooks/use-ocr-status";
import type { NoteType } from "@/types/note";
import { useTranslation } from "@/lib/i18n";

interface BookNotesPreviewProps {
  notes: Array<{
    id: string;
    type: NoteType;
    content: string | null;
    image_url?: string | null;
    page_number?: number | null;
    created_at: string;
  }>;
  maxVisible?: number;
}

/**
 * 나의기록 더보기 미리보기 컴포넌트
 * 최근 기록을 아코디언 형태로 표시
 */
export function BookNotesPreview({
  notes,
  maxVisible = 3,
}: BookNotesPreviewProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (notes.length === 0) {
    return null;
  }

  const visibleNotes = isExpanded ? notes : notes.slice(0, maxVisible);
  const hasMore = notes.length > maxVisible;

  return (
    <div className="space-y-2">
      {visibleNotes.map((note) => {
        const hasImage = !!note.image_url;
        const typeLabel = getNoteTypeLabel(note.type, hasImage);
        
        return (
          <NotePreviewItem
            key={note.id}
            note={note}
            typeLabel={typeLabel}
            hasImage={hasImage}
          />
        );
      })}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full min-h-[36px]"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" aria-hidden="true" />
              {t("common.showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" aria-hidden="true" />
              {t("common.showMore")} ({t("notes.moreCount", { count: notes.length - maxVisible })})
            </>
          )}
        </Button>
      )}
    </div>
  );
}

/**
 * 개별 기록 미리보기 아이템 컴포넌트
 * OCR 상태 확인을 위해 별도 컴포넌트로 분리
 */
function NotePreviewItem({
  note,
  typeLabel,
  hasImage,
}: {
  note: {
    id: string;
    type: NoteType;
    content: string | null;
    image_url?: string | null;
    page_number?: number | null;
    created_at: string;
  };
  typeLabel: string;
  hasImage: boolean;
}) {
  // OCR 상태 확인: transcription 타입이고 이미지가 있는 경우 실제 상태 확인
  const { status: ocrStatus } = useOCRStatus({
    noteId: note.id,
    enabled: note.type === "transcription" && hasImage,
    pollInterval: 3000,
  });

  return (
    <div className="p-3 rounded-lg border bg-muted/50 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-xs">
          {typeLabel}
        </Badge>
        {ocrStatus && (
          <OCRStatusBadge status={ocrStatus} className="text-xs" />
        )}
        <span className="text-xs text-muted-foreground">
          {formatSmartDate(note.created_at)}
        </span>
      </div>
      <NoteContentViewer
        content={note.content}
        pageNumber={note.page_number || null}
        maxLength={100}
      />
    </div>
  );
}

