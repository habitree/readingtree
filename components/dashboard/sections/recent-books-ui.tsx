"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight, PenLine } from "lucide-react";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n";

interface RecentBook {
  book: {
    id: string;
    title: string;
    cover_image_url?: string | null;
  };
  noteCount: number;
}

interface RecentBooksUIProps {
  recentBooks: RecentBook[];
}

/**
 * 최근 기록한 책 섹션 UI (클라이언트 컴포넌트)
 * 번역을 위해 useTranslation 사용
 */
export function RecentBooksUI({ recentBooks }: RecentBooksUIProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="mb-2">{t("dashboard.recentRecords")}</CardTitle>
            </div>
          </div>
          {/* 빠른 링크: 전체 노트 보기 (Cognitive Fluency - 마찰 감소) */}
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-primary shrink-0">
            <Link href="/notes">
              <span className="text-xs">{t("dashboard.viewAllNotes")}</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentBooks && recentBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {recentBooks.map((item) => (
              <Link
                key={item.book.id}
                href={`/books/${item.book.id}`}
                className="group space-y-2"
              >
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg border shadow-sm group-hover:shadow-md group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                  {item.book.cover_image_url && isValidImageUrl(item.book.cover_image_url) ? (
                    <Image
                      src={getImageUrl(item.book.cover_image_url)}
                      alt={item.book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors leading-tight">
                    {item.book.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {t("dashboard.noteRecordCount", { count: item.noteCount })}
                    </p>
                    {/* 빠른 링크: 해당 책 기록 보기 */}
                    <span className="hidden group-hover:flex items-center gap-0.5 text-[10px] text-primary">
                      <PenLine className="h-2.5 w-2.5" />
                      <span>{t("dashboard.viewAction")}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("dashboard.noRecords")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
