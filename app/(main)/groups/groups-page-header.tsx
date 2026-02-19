"use client";

import { useTranslation } from "@/lib/i18n";
import { typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export function GroupsPageHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className={typography.pageTitle}>{t("groups.pageTitle")}</h1>
        <p className={typography.pageDescription}>{t("groups.pageDesc")}</p>
      </div>
      <Button asChild className="shrink-0">
        <Link href="/groups/new">
          <Plus className="mr-2 h-4 w-4" />
          {t("groups.createGroup")}
        </Link>
      </Button>
    </div>
  );
}
