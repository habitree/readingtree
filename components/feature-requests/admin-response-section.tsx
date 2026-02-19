"use client";

import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";

interface AdminResponseSectionProps {
  adminResponse: string;
}

export function AdminResponseSection({ adminResponse }: AdminResponseSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary">{t("featureRequests.adminResponse")}</Badge>
      </div>
      <p className="text-sm whitespace-pre-wrap">
        {adminResponse}
      </p>
    </div>
  );
}
