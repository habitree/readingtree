"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookshelfWithStats } from "@/types/bookshelf";
import { BookOpen, Library, Users, RefreshCcw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface BookshelfCardProps {
  bookshelf: BookshelfWithStats;
  isGuest?: boolean;
}

export function BookshelfCard({ bookshelf, isGuest = false }: BookshelfCardProps) {
  const { t } = useTranslation();
  const isMain = bookshelf.is_main;
  const isGroupBookshelf = !!bookshelf.group_id;

  return (
    <Link href={isMain ? "/books" : `/bookshelves/${bookshelf.id}`}>
      <Card className={cn(
        "hover:shadow-lg transition-shadow cursor-pointer h-full",
        isGroupBookshelf && "border-l-4 border-l-emerald-500"
      )}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isMain ? (
                <Library className="h-5 w-5 text-primary" />
              ) : isGroupBookshelf ? (
                <Users className="h-5 w-5 text-emerald-600" />
              ) : (
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              )}
              <CardTitle className="text-lg">{bookshelf.name}</CardTitle>
            </div>
            {isMain && (
              <Badge variant="secondary" className="text-xs">
                {t("books.integrated")}
              </Badge>
            )}
            {isGroupBookshelf && (
              <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                <RefreshCcw className="h-3 w-3 mr-1" />
                {t("bookshelves.groupSync")}
              </Badge>
            )}
          </div>
          {bookshelf.description && (
            <CardDescription className="mt-2">{bookshelf.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("books.filterAll")}</span>
              <span className="font-semibold">{t("books.bookCount", { count: bookshelf.book_count })}</span>
            </div>
            {bookshelf.book_count > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("books.filterReading")}</span>
                  <span>{bookshelf.reading_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("books.filterCompleted")}</span>
                  <span>{bookshelf.completed_count}</span>
                </div>
                {bookshelf.paused_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("books.paused")}</span>
                    <span>{bookshelf.paused_count}</span>
                  </div>
                )}
                {bookshelf.rereading_count > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t("books.rereading")}</span>
                    <span>{bookshelf.rereading_count}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
