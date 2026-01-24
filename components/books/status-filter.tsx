"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReadingStatus } from "@/types/book";

interface StatusFilterProps {
  currentStatus?: ReadingStatus;
  basePath?: string;
}

/**
 * 상태 필터 컴포넌트
 */
export function StatusFilter({ currentStatus, basePath: propBasePath }: StatusFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 현재 경로에 따라 기본 경로 결정 (서재 개별 페이지, 샘플 페이지인지 확인)
  const basePath = propBasePath || (pathname?.startsWith("/bookshelves/") ? pathname : pathname?.startsWith("/sample") ? "/sample" : "/books");

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <Select
      value={currentStatus || "all"}
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className="w-[120px] sm:w-[150px] h-9 text-sm">
        <SelectValue placeholder="상태" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">전체</SelectItem>
        <SelectItem value="reading">읽는 중</SelectItem>
        <SelectItem value="completed">완독</SelectItem>
        <SelectItem value="paused">중단</SelectItem>
        <SelectItem value="not_started">읽기전</SelectItem>
        <SelectItem value="rereading">재독</SelectItem>
      </SelectContent>
    </Select>
  );
}

