"use client";

/**
 * 리포트 템플릿 편집기
 * 비주얼 3패널 빌더를 렌더링하는 래퍼 컴포넌트
 */

import { TemplateBuilder } from "./template-builder/template-builder";
import type { ReportTemplate } from "@/types/ai/report-template";

interface ReportTemplateEditorProps {
  template: ReportTemplate | null;
  onSave: (data: ReportTemplate) => Promise<void>;
  onClose: () => void;
}

export function ReportTemplateEditor({
  template,
  onSave,
  onClose,
}: ReportTemplateEditorProps) {
  return (
    <TemplateBuilder
      template={template}
      onSave={onSave}
      onClose={onClose}
    />
  );
}
