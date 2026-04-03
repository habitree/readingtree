"use client";

import { CheckCircle2, XCircle, SkipForward, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import type { BulkAddResult } from "@/app/actions/books/_shared";

interface BulkUploadSummaryProps {
  results: BulkAddResult[];
  summary: { total: number; added: number; skipped: number; failed: number };
}

export function BulkUploadSummary({ results, summary }: BulkUploadSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">{t("books.bulkCompleteTitle")}</h3>
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

      {/* 개별 결과 */}
      <div className="space-y-1 max-h-[50vh] overflow-y-auto">
        {results.map((result, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50"
          >
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : result.error === "이미 추가된 책입니다." ? (
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

      {/* 하단 버튼 */}
      <div className="flex justify-center pt-2">
        <Button asChild>
          <Link href="/books">{t("books.bulkBackToLibrary")}</Link>
        </Button>
      </div>
    </div>
  );
}
