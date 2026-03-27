"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Loader2,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { OrganizeSuggestion, ShelfSuggestion } from "@/app/actions/ai/organize-bookshelf";

type Step = "input" | "loading" | "preview" | "applying" | "done";

const EXAMPLE_CRITERIA = [
  "장르별로 정리해줘 (소설, 에세이, 자기계발 등)",
  "읽은 상태별로 정리해줘",
  "주제별로 분류해줘 (심리학, 경제, 역사 등)",
  "분위기별로 나눠줘 (가벼운 읽기, 깊은 사고, 감성적)",
  "올해 읽은 책과 작년 책을 분리해줘",
];

export function AIOrganizeDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [criteria, setCriteria] = useState("");
  const [suggestion, setSuggestion] = useState<OrganizeSuggestion | null>(null);
  const [result, setResult] = useState<{ created: number; moved: number } | null>(null);

  const reset = () => {
    setStep("input");
    setCriteria("");
    setSuggestion(null);
    setResult(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // 닫을 때 리셋 (done 상태에서 닫으면 새로고침)
      if (step === "done") {
        router.refresh();
      }
      setTimeout(reset, 300);
    }
  };

  const handleAnalyze = async () => {
    if (!criteria.trim()) {
      toast.error("정리 기준을 입력해주세요");
      return;
    }

    setStep("loading");

    try {
      const { getOrganizeSuggestion } = await import("@/app/actions/ai/organize-bookshelf");
      const result = await getOrganizeSuggestion(criteria.trim());
      setSuggestion(result);
      setStep("preview");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "AI 분석 중 오류가 발생했습니다"
      );
      setStep("input");
    }
  };

  const handleApply = async () => {
    if (!suggestion) return;

    setStep("applying");

    try {
      const { applyOrganizeSuggestion } = await import("@/app/actions/ai/organize-bookshelf");
      const result = await applyOrganizeSuggestion(suggestion.shelves);
      setResult(result);
      setStep("done");
      toast.success("서재 정리가 완료되었습니다!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "서재 정리 적용 중 오류가 발생했습니다"
      );
      setStep("preview");
    }
  };

  const totalBooks = suggestion?.shelves.reduce((sum, s) => sum + s.books.length, 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-4 w-4" />
          AI 정리
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI 서재 정리
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: 기준 입력 */}
        {step === "input" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                어떤 기준으로 서재를 정리할까요?
              </p>
              <Textarea
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="예: 장르별로 정리해줘"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* 예시 기준 */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">추천 기준</p>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_CRITERIA.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setCriteria(ex)}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-full border transition-colors",
                      criteria === ex
                        ? "bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300"
                        : "hover:bg-accent"
                    )}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!criteria.trim()}
              className="w-full gap-2"
            >
              <Wand2 className="h-4 w-4" />
              AI 분석 시작
            </Button>
          </div>
        )}

        {/* Step 2: 로딩 */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-violet-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">AI가 서재를 분석하고 있어요</p>
              <p className="text-sm text-muted-foreground">잠시만 기다려주세요...</p>
            </div>
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Step 3: 제안 미리보기 */}
        {step === "preview" && suggestion && (
          <div className="space-y-4 flex-1 overflow-y-auto -mx-6 px-6">
            {/* 요약 */}
            <Card className="p-3 bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800">
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                {suggestion.summary}
              </p>
              <p className="text-xs text-violet-600/70 dark:text-violet-400/60 mt-1">
                {suggestion.shelves.length}개 서재 · {totalBooks}권 분류
              </p>
            </Card>

            {/* 각 서재 제안 */}
            {suggestion.shelves.map((shelf, idx) => (
              <ShelfPreviewCard key={idx} shelf={shelf} index={idx} />
            ))}

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-2 pb-1 sticky bottom-0 bg-background">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => {
                  setSuggestion(null);
                  setStep("input");
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                다시 분석
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleApply}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                이대로 적용
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: 적용 중 */}
        {step === "applying" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <div className="text-center space-y-1">
              <p className="font-medium">서재를 정리하고 있어요</p>
              <p className="text-sm text-muted-foreground">서재 생성 + 책 이동 중...</p>
            </div>
          </div>
        )}

        {/* Step 5: 완료 */}
        {step === "done" && result && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-lg font-semibold">서재 정리 완료!</p>
              <p className="text-sm text-muted-foreground">
                {result.created > 0 && `${result.created}개 서재 생성 · `}
                {result.moved}권 이동 완료
              </p>
            </div>
            <Button
              onClick={() => handleOpenChange(false)}
              className="gap-1.5"
            >
              확인
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShelfPreviewCard({ shelf, index }: { shelf: ShelfSuggestion; index: number }) {
  const [expanded, setExpanded] = useState(index < 2); // 처음 2개는 펼침

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{shelf.shelfName}</p>
          <p className="text-xs text-muted-foreground truncate">{shelf.description}</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {shelf.books.length}권
        </Badge>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            expanded && "rotate-90"
          )}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t">
          <div className="space-y-1 pt-2">
            {shelf.books.map((book) => (
              <div
                key={book.userBookId}
                className="flex items-center gap-2 text-xs py-1"
              >
                <span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                <span className="truncate">{book.title}</span>
                {book.author && (
                  <span className="text-muted-foreground shrink-0 ml-auto">
                    {book.author}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
