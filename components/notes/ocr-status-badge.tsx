"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface OCRStatusBadgeProps {
  status: "processing" | "completed" | "failed" | null;
  className?: string;
}

/**
 * OCR 처리 상태 배지 컴포넌트
 */
export function OCRStatusBadge({ status, className }: OCRStatusBadgeProps) {
  const { t } = useTranslation();

  if (!status) {
    return null;
  }

  const statusConfig = {
    processing: {
      label: t("notes.ocrProcessing"),
      icon: Loader2,
      variant: "secondary" as const,
      className: "animate-spin",
    },
    completed: {
      label: t("notes.ocrCompleted"),
      icon: CheckCircle2,
      variant: "default" as const,
      className: "",
    },
    failed: {
      label: t("notes.ocrFailed"),
      icon: AlertCircle,
      variant: "destructive" as const,
      className: "",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={cn("text-xs gap-1", className)}>
      <Icon className={cn("h-3 w-3", config.className)} />
      {config.label}
    </Badge>
  );
}

