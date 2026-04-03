"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { addBooks } from "@/app/actions/books";
import { BulkPasteGrid } from "./bulk-paste-grid";
import { BulkMatchReview } from "./bulk-match-review";
import { BulkUploadSummary } from "./bulk-upload-summary";
import type { BulkBookRow, BulkAddResult, AddBookInput } from "@/app/actions/books/_shared";

type Step = "input" | "review" | "uploading" | "done";

export function BulkBookRegister() {
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
      const result = await addBooks(selectedBooks, "reading");
      setUploadResults(result.results);
      setUploadSummary(result.summary);
      setStep("done");

      if (result.summary.added > 0) {
        toast.success(t("books.bulkAddSuccess", { count: result.summary.added }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("books.bulkAddFailed"));
      setStep("review");
    }
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
          <p className="text-sm text-muted-foreground">{t("books.bulkUploading")}</p>
        </div>
      )}

      {step === "done" && (
        <BulkUploadSummary results={uploadResults} summary={uploadSummary} />
      )}
    </div>
  );
}
