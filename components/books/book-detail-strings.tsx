"use client";

import { useTranslation } from "@/lib/i18n";

export function GuestCtaText() {
  const { t } = useTranslation();
  return <>{t("books.guestCtaQuestion")}</>;
}

export function GuestCtaButtonLabel() {
  const { t } = useTranslation();
  return <>{t("books.guestCtaButton")}</>;
}

export function CompletedBadgeLabel() {
  const { t } = useTranslation();
  return <>{t("books.completedBadge")}</>;
}

export function StartedDateSuffix() {
  const { t } = useTranslation();
  return <> {t("books.startedSuffix")}</>;
}

export function CompletedDateSuffix({ count }: { count: number }) {
  const { t } = useTranslation();
  return (
    <>
      {" "}{t("books.completedSuffix")}
      {count > 1 && ` (${t("books.timesCount", { count })})`}
    </>
  );
}

export function ReadingReasonPrompt({ bookTitle }: { bookTitle: string }) {
  const { t } = useTranslation();
  return (
    <>&apos;{bookTitle}&apos;{t("books.readingReasonPrompt")}</>
  );
}

export function WriteNoteLabel() {
  const { t } = useTranslation();
  return <>{t("books.writeNote")}</>;
}

export function ReadingRecordsHeading() {
  const { t } = useTranslation();
  return <>{t("books.readingRecords")}</>;
}

export function BookInfoSectionLabel() {
  const { t } = useTranslation();
  return <>{t("books.bookInfoSection")}</>;
}

export function RelatedBooksLabel() {
  const { t } = useTranslation();
  return <>{t("books.relatedBooks")}</>;
}
