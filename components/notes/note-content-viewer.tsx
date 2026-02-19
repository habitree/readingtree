"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseNoteContentFields } from "@/lib/utils/note";
import { BookLinkRenderer } from "@/components/notes/book-link-renderer";
import { Quote, MessageCircle, ChevronRight } from "lucide-react";
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
  const [open, setOpen] = useState(false);

  if (!content) {
    return null;
  }

  const { quote, memo } = parseNoteContentFields(content);
  const hasQuote = Boolean(quote && quote.trim().length > 0);
  const hasMemo = Boolean(memo && memo.trim().length > 0);

  // 전체 보기 필요 여부
  const isLong =
    (hasQuote && quote && quote.length > maxLength) ||
    (hasMemo && memo && memo.length > maxLength);

  // 안전한 값 추출
  const safeQuote = quote ?? "";
  const safeMemo = memo ?? "";

  // Compact 모드: 카드 내부에서 사용
  if (compact) {
    return (
      <div className="space-y-1.5">
        {/* 구절 - 파란색 왼쪽 테두리로 강조 */}
        {hasQuote && (
          <div className="pl-2.5 border-l-2 border-primary/60">
            <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
              <BookLinkRenderer text={safeQuote.length > maxLength ? safeQuote.substring(0, maxLength) + "..." : safeQuote} />
            </p>
          </div>
        )}

        {/* 메모 - 회색 스타일 */}
        {hasMemo && (
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1 italic">
            <BookLinkRenderer text={safeMemo.length > 60 ? safeMemo.substring(0, 60) + "..." : safeMemo} />
          </p>
        )}

        {/* 더보기 버튼 */}
        {isLong && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-primary hover:text-primary/80 -ml-1"
              >
                {t("notes.viewFullLabel")}
                <ChevronRight className="ml-0.5 h-3 w-3" />
              </Button>
            </DialogTrigger>
            <FullContentDialog
              quote={safeQuote}
              memo={safeMemo}
              pageNumber={pageNumber}
              hasQuote={hasQuote}
              hasMemo={hasMemo}
            />
          </Dialog>
        )}
      </div>
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

/**
 * 전체 내용 다이얼로그
 */
function FullContentDialog({
  quote,
  memo,
  pageNumber,
  hasQuote,
  hasMemo,
}: {
  quote: string;
  memo: string;
  pageNumber: number | null;
  hasQuote: boolean;
  hasMemo: boolean;
}) {
  const { t } = useTranslation();
  return (
    <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
      <DialogHeader className="pb-3">
        <DialogTitle className="text-base sm:text-lg">{t("notes.noteContent")}</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">{t("notes.viewFullContentDesc")}</DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        {/* 구절 */}
        {hasQuote && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-primary">
              <Quote className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{t("notes.impressiveQuote")}</h4>
            </div>
            <div className="pl-4 border-l-2 border-primary bg-primary/5 rounded-r-lg py-3 pr-4">
              <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                <BookLinkRenderer text={quote} />
              </p>
            </div>
          </div>
        )}

        {/* 메모 */}
        {hasMemo && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{t("notes.myThought")}</h4>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                <BookLinkRenderer text={memo} />
              </p>
            </div>
          </div>
        )}

        {/* 페이지 */}
        {pageNumber && (
          <p className="text-sm text-muted-foreground pt-2 border-t">
            {t("notes.pageLabel", { page: pageNumber })}
          </p>
        )}
      </div>
    </DialogContent>
  );
}

