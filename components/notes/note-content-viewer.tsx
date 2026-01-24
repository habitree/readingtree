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
import { Eye } from "lucide-react";

interface NoteContentViewerProps {
  content: string | null;
  pageNumber: number | null;
  maxLength?: number;
}

/**
 * 기록 내용 뷰어 컴포넌트
 * 긴 텍스트의 경우 팝업으로 전체 내용을 볼 수 있도록 함
 */
export function NoteContentViewer({
  content,
  pageNumber,
  maxLength = 100,
}: NoteContentViewerProps) {
  const [open, setOpen] = useState(false);

  if (!content) {
    return null;
  }

  const { quote, memo } = parseNoteContentFields(content);
  const hasQuote = quote && quote.trim().length > 0;
  const hasMemo = memo && memo.trim().length > 0;

  // 인상깊은 구절 또는 내 생각 중 하나라도 길면 전체 보기 버튼 표시
  const isLong = 
    (hasQuote && quote.length > maxLength) || 
    (hasMemo && memo.length > maxLength);

  // 표시할 텍스트 생성
  const displayParts: string[] = [];
  if (hasQuote) {
    const truncatedQuote = quote.length > maxLength 
      ? quote.substring(0, maxLength) + "..."
      : quote;
    displayParts.push(`인상깊은 구절: ${truncatedQuote}`);
  }
  if (hasMemo) {
    const truncatedMemo = memo.length > maxLength 
      ? memo.substring(0, maxLength) + "..."
      : memo;
    displayParts.push(`내 생각: ${truncatedMemo}`);
  }
  if (pageNumber) {
    displayParts.push(`페이지: ${pageNumber}`);
  }

  const displayText = displayParts.join("\n");

  return (
    <div className="space-y-1.5">
      {displayText && (
        <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line line-clamp-2 sm:line-clamp-3">
          <BookLinkRenderer text={displayText} />
        </p>
      )}
      {isLong && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 sm:h-7 px-2 text-[10px] sm:text-xs text-primary">
              <Eye className="mr-1 h-3 w-3" />
              더보기
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-base sm:text-lg">기록 내용</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">전체 내용</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {hasQuote && (
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-primary">인상깊은 구절</h4>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap bg-primary/5 p-3 sm:p-4 rounded-lg border-l-2 border-primary">
                    <BookLinkRenderer text={quote} />
                  </p>
                </div>
              )}
              {hasMemo && (
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground">내 생각</h4>
                  <p className="text-xs sm:text-sm whitespace-pre-wrap bg-muted/50 p-3 sm:p-4 rounded-lg">
                    <BookLinkRenderer text={memo} />
                  </p>
                </div>
              )}
              {pageNumber && (
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground">페이지</h4>
                  <p className="text-xs sm:text-sm bg-muted/50 p-3 rounded-lg inline-block">
                    p. {pageNumber}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

