"use client";

import { parseBookLinkParts } from "@/lib/utils/book-link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface BookLinkRendererProps {
  text: string;
  className?: string;
}

/**
 * 책 링크를 렌더링하는 클라이언트 컴포넌트
 * 서버 컴포넌트에서 사용할 수 있도록 분리
 */
export function BookLinkRenderer({ text, className }: BookLinkRendererProps) {
  const { t } = useTranslation();
  const parts = parseBookLinkParts(text);
  const router = useRouter();
  const [invalidLinks, setInvalidLinks] = useState<Set<string>>(new Set());

  const handleBookLinkClick = (e: React.MouseEvent, userBookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 이미 유효하지 않은 링크로 표시된 경우 클릭 방지
    if (invalidLinks.has(userBookId)) {
      toast.error(t("notes.bookDeletedOrInaccessible"));
      return;
    }

    // 라우터로 이동 (에러는 책 상세 페이지에서 처리됨)
    router.push(`/books/${userBookId}`);
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "link" && part.userBookId) {
          const isInvalid = invalidLinks.has(part.userBookId);
          return (
            <span key={`book-link-${index}`} className="inline-flex items-center gap-1">
              <button
                onClick={(e) => handleBookLinkClick(e, part.userBookId!)}
                disabled={isInvalid}
                className={isInvalid 
                  ? "text-muted-foreground line-through cursor-not-allowed" 
                  : "text-primary hover:underline font-medium underline decoration-primary/50 cursor-pointer"
                }
                title={isInvalid ? t("notes.bookDeletedTitle") : undefined}
              >
                {part.content}
              </button>
              {isInvalid && (
                <AlertCircle className="w-3 h-3 text-destructive inline-block" />
              )}
            </span>
          );
        }
        return <span key={`text-${index}`}>{part.content}</span>;
      })}
    </span>
  );
}

