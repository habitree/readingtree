"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Library, BookOpen, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { getBookshelves } from "@/app/actions/bookshelves";
import type { Bookshelf } from "@/types/bookshelf";

interface MobileBookshelfSelectorProps {
  currentBookshelfId?: string;
}

/**
 * 모바일용 서재 선택기
 * 서재 페이지 상단에 표시되어 하위 서재로 빠르게 이동 가능
 * lg 이상에서는 숨김 (사이드바 사용)
 */
export function MobileBookshelfSelector({
  currentBookshelfId,
}: MobileBookshelfSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBookshelves() {
      try {
        const data = await getBookshelves();
        setBookshelves(data);
      } catch (error) {
        console.error("서재 목록 조회 오류:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookshelves();
  }, []);

  if (isLoading) {
    return (
      <div className="lg:hidden">
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (bookshelves.length === 0) {
    return null;
  }

  const mainBookshelf = bookshelves.find((b) => b.is_main);
  const subBookshelves = bookshelves.filter((b) => !b.is_main);

  // 현재 선택된 서재 찾기
  const isMainSelected = pathname === "/books";
  const currentSubBookshelf = subBookshelves.find(
    (b) => b.id === currentBookshelfId
  );

  const selectedLabel = isMainSelected
    ? mainBookshelf?.name || "전체 서재"
    : currentSubBookshelf?.name || "서재 선택";

  const handleSelect = (bookshelfId: string | null) => {
    if (bookshelfId === null) {
      router.push("/books");
    } else {
      router.push(`/bookshelves/${bookshelfId}`);
    }
  };

  return (
    <div className="lg:hidden shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2 gap-1 text-xs font-medium"
          >
            <Library className="h-3.5 w-3.5" />
            <span className="max-w-[80px] truncate hidden xs:inline">{selectedLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {/* 메인 서재 (전체) */}
          {mainBookshelf && (
            <DropdownMenuItem
              onClick={() => handleSelect(null)}
              className={cn(
                "gap-2",
                isMainSelected && "bg-accent"
              )}
            >
              <Library className="h-4 w-4" />
              <span className="flex-1">{mainBookshelf.name}</span>
              {isMainSelected && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          )}

          {/* 하위 서재가 있으면 구분선 */}
          {subBookshelves.length > 0 && <DropdownMenuSeparator />}

          {/* 하위 서재 목록 */}
          {subBookshelves.map((bookshelf) => {
            const isSelected = bookshelf.id === currentBookshelfId;
            return (
              <DropdownMenuItem
                key={bookshelf.id}
                onClick={() => handleSelect(bookshelf.id)}
                className={cn(
                  "gap-2 pl-6",
                  isSelected && "bg-accent"
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span className="flex-1 truncate">{bookshelf.name}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
