"use client";

import { useTranslation } from "@/lib/i18n";
import { typography } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function UserProfilePageHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4">
      <Button variant="ghost" size="icon" asChild>
        <Link href="javascript:history.back()">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div>
        <h1 className={typography.pageTitle}>{t("profile.pageTitle")}</h1>
        <p className={typography.pageDescription}>
          {t("profile.userProfileDesc")}
        </p>
      </div>
    </div>
  );
}

export function ProfileInfoCardTitle() {
  const { t } = useTranslation();
  return <>{t("profile.profileInfoTitle")}</>;
}
