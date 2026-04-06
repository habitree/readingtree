"use client";

import { parseNoteContentFields } from "@/lib/utils/note";
import { BookLinkRenderer } from "@/components/notes/book-link-renderer";
import { Quote, MessageCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface NoteContentViewerProps {
  content: string | null;
  pageNumber: number | null;
  maxLength?: number;
  /** 카드 내부에서 사용할 때 compact 모드 활성화 */
  compact?: boolean;
}

/**
 * 기록 내용 뷰어 컴포넌트
 * 심플한 시각적 스타일로 구절과 메모를 구분
 */
export function NoteContentViewer({
  content,
  pageNumber,
  maxLength = 100,
  compact = false,
}: NoteContentViewerProps) {
  const { t } = useTranslation();

  if (!content) {
    return null;
  }

  const { quote, memo } = parseNoteContentFields(content);
  const hasQuote = Boolean(quote && quote.trim().length > 0);
  const hasMemo = Boolean(memo && memo.trim().length > 0);

  const safeQuote = quote ?? "";
  const safeMemo = memo ?? "";

  // Compact 모드: 카드 내부에서 사용 (심플 — 구절 or 메모 택1, 장식 없음)
  if (compact) {
    const displayText = hasQuote ? safeQuote : safeMemo;
    const trimmed = displayText.length > maxLength
      ? displayText.substring(0, maxLength) + "..."
      : displayText;

    if (!displayText) return null;

    return (
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        <BookLinkRenderer text={trimmed} />
      </p>
    );
  }

  // 기본 모드: 상세 페이지 등에서 사용
  return (
    <div className="space-y-3">
      {/* 구절 */}
      {hasQuote && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-primary">
            <Quote className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{t("notes.impressiveQuote")}</span>
          </div>
          <div className="pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg py-2 pr-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              <BookLinkRenderer text={safeQuote} />
            </p>
          </div>
        </div>
      )}

      {/* 메모 */}
      {hasMemo && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{t("notes.myThought")}</span>
          </div>
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              <BookLinkRenderer text={safeMemo} />
            </p>
          </div>
        </div>
      )}

      {/* 페이지 */}
      {pageNumber && (
        <p className="text-xs text-muted-foreground">
          p. {pageNumber}
        </p>
      )}
    </div>
  );
}
