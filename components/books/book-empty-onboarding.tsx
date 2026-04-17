"use client";

import { useRouter } from "next/navigation";
import { Quote, PenLine, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BookEmptyOnboardingProps {
  userBookId: string;
}

/**
 * 책 상세 페이지의 기록이 없을 때 표시되는 온보딩 CTA 카드
 * 3개의 카드로 첫 기록 작성을 유도한다.
 */
export function BookEmptyOnboarding({ userBookId }: BookEmptyOnboardingProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const cards = [
    {
      icon: Quote,
      title: t("books.emptyOnboarding.addQuote"),
      description: t("books.emptyOnboarding.addQuoteDesc"),
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      ring: "hover:ring-amber-200 dark:hover:ring-amber-800",
      onClick: () => router.push(`/notes/new?bookId=${userBookId}&type=quote`),
    },
    {
      icon: PenLine,
      title: t("books.emptyOnboarding.writeThought"),
      description: t("books.emptyOnboarding.writeThoughtDesc"),
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      ring: "hover:ring-blue-200 dark:hover:ring-blue-800",
      onClick: () => router.push(`/notes/new?bookId=${userBookId}&type=memo`),
    },
    {
      icon: BarChart3,
      title: t("books.emptyOnboarding.updateProgress"),
      description: t("books.emptyOnboarding.updateProgressDesc"),
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      ring: "hover:ring-green-200 dark:hover:ring-green-800",
      onClick: () => {
        const el = document.getElementById("reading-progress");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
  ];

  return (
    <div className="flex flex-col items-center py-8 px-2">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold text-foreground mb-1">
          {t("books.emptyOnboarding.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("books.emptyOnboarding.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={card.onClick}
            className={cn(
              "flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border",
              "transition-all duration-200 ring-1 ring-transparent",
              "hover:shadow-md hover:ring-2 active:scale-[0.98]",
              "cursor-pointer text-center",
              card.ring,
            )}
          >
            <div className={cn("rounded-full p-3", card.bg)}>
              <card.icon className={cn("h-5 w-5", card.color)} />
            </div>
            <span className="text-sm font-medium text-foreground">
              {card.title}
            </span>
            <span className="text-xs text-muted-foreground leading-relaxed">
              {card.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
