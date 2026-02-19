"use client";

import { useTranslation, type TranslationKey } from "@/lib/i18n";
import { typography } from "@/lib/design-tokens";

interface PageHeaderProps {
  titleKey: TranslationKey;
  descriptionKey?: TranslationKey;
}

export function PageHeader({ titleKey, descriptionKey }: PageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className={typography.pageTitle}>{t(titleKey)}</h1>
      {descriptionKey && (
        <p className={typography.pageDescription}>{t(descriptionKey)}</p>
      )}
    </div>
  );
}
