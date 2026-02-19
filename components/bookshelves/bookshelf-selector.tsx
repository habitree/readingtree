"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBookshelves } from "@/app/actions/bookshelves";
import { Bookshelf } from "@/types/bookshelf";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/lib/i18n";

interface BookshelfSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  excludeMain?: boolean;
  placeholder?: string;
}

export function BookshelfSelector({
  value,
  onValueChange,
  excludeMain = false,
  placeholder,
}: BookshelfSelectorProps) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("books.selectShelf");
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(excludeMain ? data.filter((b) => !b.is_main) : data);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookshelves();
  }, [excludeMain]);

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {bookshelves.map((bookshelf) => (
          <SelectItem key={bookshelf.id} value={bookshelf.id}>
            {bookshelf.name}
            {bookshelf.is_main && ` (${t("books.integrated")})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
