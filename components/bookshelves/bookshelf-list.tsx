"use client";

import { BookshelfCard } from "./bookshelf-card";
import { BookshelfWithStats } from "@/types/bookshelf";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";

interface BookshelfListProps {
  bookshelves: BookshelfWithStats[];
  isLoading?: boolean;
  isGuest?: boolean;
}

export function BookshelfList({ bookshelves, isLoading, isGuest = false }: BookshelfListProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (bookshelves.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isGuest ? t("bookshelves.noBookshelvesGuest") : t("bookshelves.noBookshelves")}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookshelves.map((bookshelf) => (
        <BookshelfCard key={bookshelf.id} bookshelf={bookshelf} isGuest={isGuest} />
      ))}
    </div>
  );
}
