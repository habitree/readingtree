"use client";

import { BookshelfCard } from "./bookshelf-card";
import { BookshelfWithStats } from "@/types/bookshelf";
import { Skeleton } from "@/components/ui/skeleton";

interface BookshelfListProps {
  bookshelves: BookshelfWithStats[];
  isLoading?: boolean;
  isGuest?: boolean;
}

export function BookshelfList({ bookshelves, isLoading, isGuest = false }: BookshelfListProps) {
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
          {isGuest ? "체험 서재가 없어요." : "서재가 없습니다. 새 서재를 만들어보세요."}
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
