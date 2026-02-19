"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BookOpen, Quote, Share2 } from "lucide-react";

interface ShareCtaSectionProps {
  variant: "note" | "bookshelf";
}

export function ShareCtaSection({ variant }: ShareCtaSectionProps) {
  const { t } = useTranslation();

  const isNote = variant === "note";
  const headline = isNote ? t("share.ctaHeadline") : t("share.bookshelfCtaHeadline");
  const desc = isNote ? t("share.ctaDesc") : t("share.bookshelfCtaDesc");

  return (
    <div className="mt-16 space-y-10">
      {/* 메인 CTA */}
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 italic tracking-tight">
            ReadTree
          </h2>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {headline}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed whitespace-pre-line">
            {desc}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="rounded-full px-8 h-12 text-sm font-bold shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/login">
              {isNote ? t("share.ctaCreateCard") : t("share.makeMyBookshelf")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 h-12 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/login">
              {t("share.ctaStartRecord")}
            </Link>
          </Button>
        </div>
      </div>

      {/* 사용 사례 섹션 */}
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
          {t("share.useCaseTitle")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UseCaseCard
            icon={<BookOpen className="w-5 h-5 text-forest-600" />}
            title={t("share.useCaseReaderTitle")}
            desc={t("share.useCaseReaderDesc")}
          />
          <UseCaseCard
            icon={<Quote className="w-5 h-5 text-blue-600" />}
            title={t("share.useCaseCasualTitle")}
            desc={t("share.useCaseCasualDesc")}
          />
          <UseCaseCard
            icon={<Share2 className="w-5 h-5 text-purple-600" />}
            title={t("share.useCaseCreatorTitle")}
            desc={t("share.useCaseCreatorDesc")}
          />
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center space-y-2">
      <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}
