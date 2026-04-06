"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type BookSortOption = "recent" | "title" | "author" | "progress" | "added";

/**
 * 서재 정렬 선택 컴포넌트
 */
export function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSort = (searchParams.get("sort") as BookSortOption) || "recent";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "recent") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <Select value={currentSort} onValueChange={handleSortChange}>
      <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-sm">
        <ArrowUpDown className="h-3.5 w-3.5 mr-1 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recent">최근 읽은 순</SelectItem>
        <SelectItem value="added">추가일 순</SelectItem>
        <SelectItem value="title">제목 순</SelectItem>
        <SelectItem value="author">저자 순</SelectItem>
        <SelectItem value="progress">진행률 순</SelectItem>
      </SelectContent>
    </Select>
  );
}
