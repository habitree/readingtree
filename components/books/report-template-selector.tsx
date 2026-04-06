"use client";

/**
 * 리포트 템플릿 선택 UI
 * 사용자가 리포트 생성 전 템플릿을 선택할 수 있는 컴포넌트
 */

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReportTemplates } from "@/app/actions/ai/report-templates";
import type { ReportTemplate } from "@/types/ai/report-template";
import { TONE_LABELS, LENGTH_LABELS } from "@/types/ai/report-template";

interface ReportTemplateSelectorProps {
  isMultiRead: boolean;
  onSelect: (templateId: string | undefined) => void;
  selectedId?: string;
}

export function ReportTemplateSelector({
  isMultiRead,
  onSelect,
  selectedId,
}: ReportTemplateSelectorProps) {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportTemplates()
      .then((data) => {
        // 다회독이 아닌 경우 multiReadAware 템플릿 필터링
        const filtered = isMultiRead
          ? data
          : data.filter((t) => !t.multiReadAware);
        setTemplates(filtered);
      })
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, [isMultiRead]);

  if (loading || templates.length === 0) return null;

  const selected = templates.find((t) => t.id === selectedId);

  return (
    <div className="space-y-2">
      <Select
        value={selectedId || "auto"}
        onValueChange={(v) => onSelect(v === "auto" ? undefined : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="리포트 스타일 선택" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">자동 (기본 템플릿)</SelectItem>
          {templates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              <span className="flex items-center gap-2">
                {t.name}
                <span className="text-xs text-muted-foreground">
                  ({t.sections.length}섹션 · {TONE_LABELS[t.tone]} · {LENGTH_LABELS[t.targetLength]})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <p className="text-xs text-muted-foreground px-1">{selected.description}</p>
      )}
    </div>
  );
}
