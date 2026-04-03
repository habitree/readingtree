"use client";

import { useState, useCallback } from "react";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/i18n";
import type { BulkBookRow } from "@/app/actions/books/_shared";

const MAX_ROWS = 50;

interface BulkPasteGridProps {
  onNext: (rows: BulkBookRow[]) => void;
}

interface GridRow {
  title: string;
  isbn: string;
  author: string;
  publisher: string;
}

const emptyRow = (): GridRow => ({ title: "", isbn: "", author: "", publisher: "" });

export function BulkPasteGrid({ onNext }: BulkPasteGridProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<GridRow[]>([emptyRow(), emptyRow(), emptyRow()]);

  const updateRow = useCallback((index: number, field: keyof GridRow, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= MAX_ROWS) return prev;
      return [...prev, emptyRow()];
    });
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;

    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length <= 1 && !text.includes("\t")) return; // 단일 셀 붙여넣기는 기본 동작

    e.preventDefault();

    const parsed: GridRow[] = lines
      .map((line) => {
        const cols = line.split("\t");
        return {
          title: cols[0]?.trim() || "",
          isbn: cols[1]?.trim() || "",
          author: cols[2]?.trim() || "",
          publisher: cols[3]?.trim() || "",
        };
      })
      .filter((row) => row.title)
      .slice(0, MAX_ROWS);

    if (parsed.length > 0) {
      setRows(parsed);
    }
  }, []);

  const handleNext = useCallback(() => {
    const validRows: BulkBookRow[] = rows
      .filter((r) => r.title.trim())
      .map((r, i) => ({
        rowIndex: i,
        title: r.title.trim(),
        isbn: r.isbn.trim() || undefined,
        author: r.author.trim() || undefined,
        publisher: r.publisher.trim() || undefined,
      }));

    if (validRows.length > 0) {
      onNext(validRows);
    }
  }, [rows, onNext]);

  const validCount = rows.filter((r) => r.title.trim()).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <ClipboardPaste className="h-4 w-4 shrink-0" />
        <span>{t("books.bulkPasteHint")}</span>
      </div>

      <div className="border rounded-lg overflow-hidden" onPaste={handlePaste}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="min-w-[180px]">
                {t("books.bulkColTitle")} <span className="text-destructive">*</span>
              </TableHead>
              <TableHead className="w-[140px]">{t("books.bulkColIsbn")}</TableHead>
              <TableHead className="w-[140px]">{t("books.bulkColAuthor")}</TableHead>
              <TableHead className="w-[140px]">{t("books.bulkColPublisher")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-center text-muted-foreground text-xs">
                  {i + 1}
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.title}
                    onChange={(e) => updateRow(i, "title", e.target.value)}
                    placeholder={t("books.bulkTitlePlaceholder")}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-1"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.isbn}
                    onChange={(e) => updateRow(i, "isbn", e.target.value)}
                    placeholder="ISBN"
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-1"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.author}
                    onChange={(e) => updateRow(i, "author", e.target.value)}
                    placeholder={t("books.bulkAuthorPlaceholder")}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-1"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.publisher}
                    onChange={(e) => updateRow(i, "publisher", e.target.value)}
                    placeholder={t("books.bulkPublisherPlaceholder")}
                    className="h-8 text-sm border-0 shadow-none focus-visible:ring-1"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={rows.length >= MAX_ROWS}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("books.bulkAddRow")}
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {t("books.bulkValidCount", { count: validCount })}
          </span>
          <Button onClick={handleNext} disabled={validCount === 0}>
            {t("books.bulkNextStep")}
          </Button>
        </div>
      </div>
    </div>
  );
}
