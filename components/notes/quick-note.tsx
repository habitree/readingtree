"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  PenLine,
  Quote,
  MessageSquare,
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useUpgradeModal, isUpgradeLimitError } from "@/hooks/use-upgrade-modal";
import { getUserBooks } from "@/app/actions/books";
import { createNote } from "@/app/actions/notes";
import confetti from "canvas-confetti";

interface ReadingBook {
  id: string;
  title: string;
  author: string | null;
  coverImageUrl: string | null;
}

interface QuickNoteProps {
  /** 컴팩트 모드 (대시보드용) */
  compact?: boolean;
  /** 기본 선택된 책 ID */
  defaultBookId?: string;
  /** 저장 후 콜백 */
  onSaved?: () => void;
  /** 컴포넌트 외부 클릭 시 닫기 */
  onClose?: () => void;
  className?: string;
}

type NoteMode = "quote" | "memo";

/**
 * Quick Note - 대시보드에서 1탭으로 기록하는 컴포넌트
 *
 * 습관 루프 강화:
 * - Cue: 읽던 책 자동 선택
 * - Routine: 간소화된 1탭 입력
 * - Reward: 축하 애니메이션 + 랜덤 칭찬
 */
export function QuickNote({
  compact = false,
  defaultBookId,
  onSaved,
  onClose,
  className,
}: QuickNoteProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();

  const PRAISE_MESSAGES = [
    t("notes.praiseMsg1"),
    t("notes.praiseMsg2"),
    t("notes.praiseMsg3"),
    t("notes.praiseMsg4"),
    t("notes.praiseMsg5"),
    t("notes.praiseMsg6"),
    t("notes.praiseMsg7"),
  ];
  const [books, setBooks] = useState<ReadingBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(defaultBookId || "");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState<NoteMode>("memo");
  const [isLoading, setIsLoading] = useState(false);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showSuccess, setShowSuccess] = useState(false);

  // 읽고 있는 책 목록 로드
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsBooksLoading(true);
        const result = await getUserBooks("reading");

        // 결과가 배열인 경우 처리
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const booksList: any[] = Array.isArray(result)
          ? result
          : (result as any)?.books || [];

        const readingBooks: ReadingBook[] = booksList.map((item) => ({
          id: item.id || item.userBookId,
          title: item.title || item.book?.title,
          author: item.author || item.book?.author,
          coverImageUrl: item.cover_image_url || item.book?.cover_image_url,
        }));

        setBooks(readingBooks);

        // 기본 책 선택 (defaultBookId가 없으면 첫 번째 책)
        if (!defaultBookId && readingBooks.length > 0) {
          setSelectedBookId(readingBooks[0].id);
        }
      } catch (error) {
        console.error("책 목록 로드 실패:", error);
      } finally {
        setIsBooksLoading(false);
      }
    };

    loadBooks();
  }, [defaultBookId]);

  // 기록 저장
  const handleSubmit = async () => {
    if (!selectedBookId) {
      toast.error(t("notes.selectBookError"));
      return;
    }

    if (!content.trim()) {
      toast.error(t("notes.enterContentError"));
      return;
    }

    setIsLoading(true);

    try {
      await createNote({
        book_id: selectedBookId,
        type: mode === "quote" ? "quote" : "memo",
        quote_content: mode === "quote" ? content.trim() : undefined,
        memo_content: mode === "memo" ? content.trim() : undefined,
        is_public: true,
      });

      // 축하 효과
      setShowSuccess(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.5 },
        colors: ["#10b981", "#34d399", "#6ee7b7"],
      });

      // 랜덤 칭찬 메시지
      const randomPraise = PRAISE_MESSAGES[Math.floor(Math.random() * PRAISE_MESSAGES.length)];
      toast.success(randomPraise);

      // 입력 초기화
      setContent("");

      // 성공 표시 후 콜백
      setTimeout(() => {
        setShowSuccess(false);
        onSaved?.();
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t("notes.noteSaveFailed");
      if (isUpgradeLimitError(errorMsg)) {
        showUpgradeModal({ feature: "독서 기록", message: errorMsg });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 컴팩트 모드에서 펼치기/접기
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 책이 없는 경우
  if (!isBooksLoading && books.length === 0) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {t("notes.noReadingBooks")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/books/search")}
          >
            {t("notes.addBookBtn")}
          </Button>
        </div>
      </Card>
    );
  }

  // 선택된 책 정보
  const selectedBook = books.find((b) => b.id === selectedBookId);

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        compact && "border-primary/20",
        className
      )}
    >
      {/* 성공 오버레이 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-emerald-500/90 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-2 text-white">
              <CheckCircle2 className="h-12 w-12" />
              <span className="text-lg font-semibold">{t("notes.saveComplete")}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 컴팩트 헤더 (클릭하면 펼침) */}
      {compact && (
        <button
          type="button"
          onClick={toggleExpand}
          className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <PenLine className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium">{t("notes.quickNote")}</span>
              {selectedBook && (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {selectedBook.title}
                </p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      )}

      {/* 입력 폼 */}
      <AnimatePresence>
        {(isExpanded || !compact) && (
          <motion.div
            initial={compact ? { height: 0, opacity: 0 } : false}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn("space-y-3", compact ? "p-3 pt-0" : "p-4")}>
              {/* 닫기 버튼 (onClose가 있는 경우) */}
              {onClose && !compact && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* 책 선택 */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{t("notes.selectBook")}</label>
                <Select
                  value={selectedBookId}
                  onValueChange={setSelectedBookId}
                  disabled={isBooksLoading || isLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("notes.selectBookPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {books.map((book) => (
                      <SelectItem key={book.id} value={book.id}>
                        <span className="truncate">{book.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 모드 선택 (구절/생각) */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "quote" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1 h-8",
                    mode === "quote" && "bg-blue-500 hover:bg-blue-600"
                  )}
                  onClick={() => setMode("quote")}
                  disabled={isLoading}
                >
                  <Quote className="h-3.5 w-3.5 mr-1.5" />
                  {t("notes.quoteMode")}
                </Button>
                <Button
                  type="button"
                  variant={mode === "memo" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1 h-8",
                    mode === "memo" && "bg-amber-500 hover:bg-amber-600"
                  )}
                  onClick={() => setMode("memo")}
                  disabled={isLoading}
                >
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                  {t("notes.memoMode")}
                </Button>
              </div>

              {/* 내용 입력 */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  mode === "quote"
                    ? t("notes.quoteModeInputPlaceholder")
                    : t("notes.memoModeInputPlaceholder")
                }
                rows={3}
                disabled={isLoading}
                className={cn(
                  "resize-none text-sm",
                  mode === "quote" && "border-blue-200 focus:border-blue-400",
                  mode === "memo" && "border-amber-200 focus:border-amber-400"
                )}
              />

              {/* 저장 버튼 */}
              <Button
                onClick={handleSubmit}
                disabled={!selectedBookId || !content.trim() || isLoading}
                className="w-full h-10"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("notes.saving")}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t("notes.recordNote")}
                  </>
                )}
              </Button>

              {/* 힌트 */}
              <p className="text-[10px] text-center text-muted-foreground">
                {t("notes.quickNoteTip")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
