"use client";

import { useTranslation } from "@/lib/i18n";

export function BookshelfDefaultDesc() {
  const { t } = useTranslation();
  return <>{t("bookshelves.defaultDesc")}</>;
}

export function BookshelfSettingsLabel() {
  const { t } = useTranslation();
  return <span className="hidden sm:inline">{t("bookshelves.settingsButton")}</span>;
}

export function BookshelfAddLabel() {
  const { t } = useTranslation();
  return <span className="hidden sm:inline">{t("bookshelves.addButton")}</span>;
}

export function BookshelfEditTitle() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{t("bookshelves.editTitle")}</h1>
      <p className="text-muted-foreground">{t("bookshelves.editDesc")}</p>
    </>
  );
}
