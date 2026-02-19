"use client";

import { useTranslation } from "@/lib/i18n";

export function BooksPageTitle() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight truncate">
        {t("books.myBooks")}
      </h1>
      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
        {t("books.myBooksDesc")}
      </p>
    </>
  );
}

export function BooksManageLabel() {
  const { t } = useTranslation();
  return <>{t("books.manageBookshelves")}</>;
}

export function BooksAddLabel() {
  const { t } = useTranslation();
  return <span className="hidden sm:inline">{t("books.addButtonLabel")}</span>;
}

export function BooksPageErrorHeading() {
  const { t } = useTranslation();
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{t("books.myBooks")}</h1>
      <p className="text-muted-foreground">{t("books.pageLoadError")}</p>
    </>
  );
}

export function BooksUnknownError({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <p className="text-sm text-muted-foreground">
      {message ?? t("books.unknownError")}
    </p>
  );
}
