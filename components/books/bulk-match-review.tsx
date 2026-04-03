"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, RefreshCw, ChevronDown, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";
import type { BulkBookRow, BulkBookMatchedRow, BulkMatchStatus, AddBookInput } from "@/app/actions/books/_shared";

interface BulkMatchReviewProps {
  rows: BulkBookRow[];
  onBack: () => void;
  onConfirm: (selectedBooks: AddBookInput[]) => void;
}

export function BulkMatchReview({ rows, onBack, onConfirm }: BulkMatchReviewProps) {
  const { t } = useTranslation();
  const [matchedRows, setMatchedRows] = useState<BulkBookMatchedRow[]>(() =>
    rows.map((input) => ({
      input,
      status: "pending" as BulkMatchStatus,
      matchedBook: null,
      alternatives: [],
      selected: null,
    }))
  );
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // 일괄 검색 실행
  useEffect(() => {
    let cancelled = false;

    async function runBatchSearch() {
      setIsSearching(true);

      try {
        const response = await fetch("/api/books/search/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries: rows }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "검색 실패");
        }

        const { results } = await response.json();

        if (cancelled) return;

        setMatchedRows((prev) =>
          prev.map((row, i) => {
            const result = results[i];
            if (!result) return row;

            const matches: AddBookInput[] = result.matches || [];
            const topMatch = matches[0] || null;

            return {
              ...row,
              status: result.error
                ? "error"
                : matches.length > 0
                  ? "matched"
                  : "no_match",
              matchedBook: topMatch,
              alternatives: matches.slice(1),
              selected: topMatch,
              error: result.error,
            };
          })
        );
        setSearchProgress(100);
      } catch (error) {
        if (cancelled) return;
        setMatchedRows((prev) =>
          prev.map((row) => ({
            ...row,
            status: "error",
            error: error instanceof Error ? error.message : "검색 실패",
          }))
        );
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }

    runBatchSearch();
    return () => { cancelled = true; };
  }, [rows]);

  // 진행률 시뮬레이션 (실제 API가 한번에 반환하므로)
  useEffect(() => {
    if (!isSearching) return;
    const estimatedMs = rows.length * 250;
    const interval = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setSearchProgress(Math.min(90, (elapsed / estimatedMs) * 100));
    }, interval);
    return () => clearInterval(timer);
  }, [isSearching, rows.length]);

  const toggleSkip = useCallback((index: number) => {
    setMatchedRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              status: row.status === "skipped" ? (row.matchedBook ? "matched" : "no_match") : "skipped",
              selected: row.status === "skipped" ? row.matchedBook : null,
            }
          : row
      )
    );
  }, []);

  const selectAlternative = useCallback((rowIndex: number, book: AddBookInput) => {
    setMatchedRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, selected: book, status: "matched" } : row
      )
    );
    setExpandedRow(null);
  }, []);

  const useInputAsIs = useCallback((index: number) => {
    setMatchedRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const fallback: AddBookInput = {
          title: row.input.title,
          isbn: row.input.isbn || null,
          author: row.input.author || null,
          publisher: row.input.publisher || null,
        };
        return { ...row, selected: fallback, status: "matched" };
      })
    );
  }, []);

  const handleConfirm = useCallback(() => {
    const selected = matchedRows
      .filter((r) => r.status !== "skipped" && r.selected)
      .map((r) => r.selected!);
    onConfirm(selected);
  }, [matchedRows, onConfirm]);

  const selectedCount = matchedRows.filter((r) => r.status !== "skipped" && r.selected).length;
  const matchedCount = matchedRows.filter((r) => r.status === "matched").length;
  const noMatchCount = matchedRows.filter((r) => r.status === "no_match").length;
  const errorCount = matchedRows.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Progress */}
      {isSearching && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("books.bulkSearching")}</span>
            <span className="text-muted-foreground">{Math.round(searchProgress)}%</span>
          </div>
          <Progress value={searchProgress} />
        </div>
      )}

      {/* Summary badges */}
      {!isSearching && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{t("books.bulkTotalCount", { count: rows.length })}</Badge>
          {matchedCount > 0 && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              {t("books.bulkMatchedCount", { count: matchedCount })}
            </Badge>
          )}
          {noMatchCount > 0 && (
            <Badge variant="outline">{t("books.bulkNoMatchCount", { count: noMatchCount })}</Badge>
          )}
          {errorCount > 0 && (
            <Badge variant="destructive">{t("books.bulkErrorCount", { count: errorCount })}</Badge>
          )}
        </div>
      )}

      {/* Match results */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {matchedRows.map((row, i) => (
          <Card
            key={i}
            className={`transition-colors ${
              row.status === "skipped" ? "opacity-50" : ""
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {/* 입력 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium truncate">
                      {row.input.title}
                    </span>
                    {row.input.author && (
                      <span className="text-xs text-muted-foreground truncate">
                        {row.input.author}
                      </span>
                    )}
                  </div>

                  {/* 매칭 결과 */}
                  {row.status === "pending" || row.status === "searching" ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t("books.bulkSearchingItem")}
                    </div>
                  ) : row.status === "error" ? (
                    <div className="text-sm text-destructive">{row.error}</div>
                  ) : row.status === "skipped" ? (
                    <div className="text-sm text-muted-foreground">{t("books.bulkSkipped")}</div>
                  ) : row.selected ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative w-8 h-10 shrink-0 overflow-hidden rounded bg-muted">
                        {isValidImageUrl(row.selected.cover_image_url) && row.selected.cover_image_url ? (
                          <Image
                            src={row.selected.cover_image_url}
                            alt={row.selected.title}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.selected.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[row.selected.author, row.selected.publisher].filter(Boolean).join(" | ")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t("books.bulkNoMatchFound")}</div>
                  )}

                  {/* 대안 펼치기 */}
                  {expandedRow === i && row.alternatives.length > 0 && (
                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                      {row.alternatives.map((alt, ai) => (
                        <button
                          key={ai}
                          onClick={() => selectAlternative(i, alt)}
                          className="flex items-center gap-2 w-full p-1.5 rounded hover:bg-muted/50 text-left transition-colors"
                        >
                          <div className="relative w-6 h-8 shrink-0 overflow-hidden rounded bg-muted">
                            {isValidImageUrl(alt.cover_image_url) && alt.cover_image_url ? (
                              <Image src={alt.cover_image_url} alt={alt.title} fill className="object-cover" sizes="24px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-2.5 w-2.5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{alt.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {[alt.author, alt.publisher].filter(Boolean).join(" | ")}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-1 shrink-0">
                  {row.status !== "pending" && row.status !== "searching" && (
                    <>
                      {(row.alternatives.length > 0 || row.status === "no_match") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            if (row.status === "no_match") {
                              useInputAsIs(i);
                            } else {
                              setExpandedRow(expandedRow === i ? null : i);
                            }
                          }}
                          title={row.status === "no_match" ? t("books.bulkUseInput") : t("books.bulkChange")}
                        >
                          {row.status === "no_match" ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedRow === i ? "rotate-180" : ""}`} />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleSkip(i)}
                        title={row.status === "skipped" ? t("books.bulkRestore") : t("books.bulkSkip")}
                      >
                        {row.status === "skipped" ? (
                          <RefreshCw className="h-3.5 w-3.5" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 하단 버튼 */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("books.bulkPrevStep")}
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("books.bulkSelectedCount", { count: selectedCount })}
          </span>
          <Button onClick={handleConfirm} disabled={selectedCount === 0 || isSearching}>
            {t("books.bulkAddAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
