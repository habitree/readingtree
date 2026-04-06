"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, SkipForward, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { addGroupBooks } from "@/app/actions/groups";
import { BulkPasteGrid } from "@/components/books/bulk-paste-grid";
import { BulkMatchReview } from "@/components/books/bulk-match-review";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BulkBookRow, BulkAddResult, AddBookInput } from "@/app/actions/books/_shared";

type Step = "input" | "review" | "uploading" | "done";

interface BulkGroupBookRegisterProps {
  groupId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function BulkGroupBookRegister({ groupId, onComplete, onCancel }: BulkGroupBookRegisterProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("input");
  const [inputRows, setInputRows] = useState<BulkBookRow[]>([]);
  const [uploadResults, setUploadResults] = useState<BulkAddResult[]>([]);
  const [uploadSummary, setUploadSummary] = useState({ total: 0, added: 0, skipped: 0, failed: 0 });

  const handleInputNext = (rows: BulkBookRow[]) => {
    setInputRows(rows);
    setStep("review");
  };

  const handleBack = () => {
    setStep("input");
  };

  const handleConfirm = async (selectedBooks: AddBookInput[]) => {
    if (selectedBooks.length === 0) return;

    setStep("uploading");

    try {
      const result = await addGroupBooks(groupId, selectedBooks);
      setUploadResults(result.results);
      setUploadSummary(result.summary);
      setStep("done");

      if (result.summary.added > 0) {
        toast.success(t("groups.bulkDesignatedAddSuccess", { count: result.summary.added }));
        onComplete?.();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("groups.bulkDesignatedAddFailed"));
      setStep("review");
    }
  };

  const handleDone = () => {
    onCancel?.();
  };

  // 스텝 인디케이터
  const steps = [
    { key: "input", label: t("books.bulkStepInput") },
    { key: "review", label: t("books.bulkStepReview") },
    { key: "done", label: t("books.bulkStepDone") },
  ];

  const currentStepIndex =
    step === "input" ? 0 : step === "review" || step === "uploading" ? 1 : 2;

  return (
    <div className="space-y-6">
      {/* 스텝 인디케이터 */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                i <= currentStepIndex
                  ? "bg-forest-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i <= currentStepIndex ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  i < currentStepIndex ? "bg-forest-600" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* 스텝 콘텐츠 */}
      {step === "input" && <BulkPasteGrid onNext={handleInputNext} />}

      {step === "review" && (
        <BulkMatchReview
          rows={inputRows}
          onBack={handleBack}
          onConfirm={handleConfirm}
        />
      )}

      {step === "uploading" && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
          <p className="text-sm text-muted-foreground">{t("groups.bulkDesignatedUploading")}</p>
        </div>
      )}

      {step === "done" && (
        <BulkGroupUploadSummary
          results={uploadResults}
          summary={uploadSummary}
          onDone={handleDone}
        />
      )}
    </div>
  );
}

/** 그룹 전용 완료 요약 (서재로 돌아가기 대신 닫기) */
function BulkGroupUploadSummary({
  results,
  summary,
  onDone,
}: {
  results: BulkAddResult[];
  summary: { total: number; added: number; skipped: number; failed: number };
  onDone: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">{t("groups.bulkDesignatedCompleteTitle")}</h3>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {summary.added > 0 && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {t("books.bulkAddedCount", { count: summary.added })}
                </Badge>
              )}
              {summary.skipped > 0 && (
                <Badge variant="outline">
                  {t("books.bulkSkippedCount", { count: summary.skipped })}
                </Badge>
              )}
              {summary.failed > 0 && (
                <Badge variant="destructive">
                  {t("books.bulkFailedCount", { count: summary.failed })}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {results.map((result, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50"
          >
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : result.error === "이미 추가된 지정도서입니다." ? (
              <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
            )}
            <span className="text-sm truncate flex-1">{result.title}</span>
            {!result.success && result.error && (
              <span className="text-xs text-muted-foreground shrink-0">{result.error}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={onDone}>{t("common.close")}</Button>
      </div>
    </div>
  );
}
