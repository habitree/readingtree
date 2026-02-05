"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PopularBookCard } from "@/components/books/popular-book-card";
import { getPopularBooks, type PopularBookCategory } from "@/app/actions/popular-books";
import type { PopularBook } from "@/lib/api/data4library-types";
import { TrendingUp, Flame, Sparkles, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PopularBooksSectionProps {
  /** 로그인 상태 (서재 추가 버튼 표시 여부) */
  isAuthenticated?: boolean;
  /** 초기 데이터 (SSR 시 전달) */
  initialData?: {
    popular?: PopularBook[];
    trending?: PopularBook[];
    mania?: PopularBook[];
  };
  /** 지역 코드 필터 */
  regionCode?: string | null;
}

type TabValue = "popular" | "trending" | "mania";

interface TabConfig {
  value: TabValue;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  {
    value: "popular",
    label: "이번 주 인기",
    icon: Flame,
    description: "전국 공공도서관 대출 순위",
  },
  {
    value: "trending",
    label: "급상승",
    icon: TrendingUp,
    description: "최근 대출 급증 도서",
  },
  {
    value: "mania",
    label: "마니아 추천",
    icon: Sparkles,
    description: "독서가들의 선택",
  },
];

/**
 * 인기 대출 도서 섹션
 * 탭 네비게이션 + 가로 스크롤 책 카드
 */
export function PopularBooksSection({
  isAuthenticated = false,
  initialData,
  regionCode,
}: PopularBooksSectionProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("popular");
  const [booksMap, setBooksMap] = useState<Record<TabValue, PopularBook[]>>({
    popular: initialData?.popular || [],
    trending: initialData?.trending || [],
    mania: initialData?.mania || [],
  });
  const [loadingMap, setLoadingMap] = useState<Record<TabValue, boolean>>({
    popular: !initialData?.popular,
    trending: true,
    mania: true,
  });
  const [errorMap, setErrorMap] = useState<Record<TabValue, string | null>>({
    popular: null,
    trending: null,
    mania: null,
  });

  // 탭별 데이터 로드
  const loadBooks = useCallback(async (category: TabValue) => {
    if (booksMap[category].length > 0) return; // 이미 로드됨

    setLoadingMap((prev) => ({ ...prev, [category]: true }));
    setErrorMap((prev) => ({ ...prev, [category]: null }));

    try {
      const result = await getPopularBooks(category, regionCode, 10);

      setBooksMap((prev) => ({ ...prev, [category]: result.books }));

      if (result.error) {
        setErrorMap((prev) => ({ ...prev, [category]: result.error! }));
      }
    } catch (error) {
      setErrorMap((prev) => ({
        ...prev,
        [category]: "도서 정보를 불러올 수 없습니다.",
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [category]: false }));
    }
  }, [booksMap, regionCode]);

  // 초기 로드 (인기 도서)
  useEffect(() => {
    if (!initialData?.popular) {
      loadBooks("popular");
    }
  }, [initialData?.popular, loadBooks]);

  // 탭 변경 시 해당 카테고리 로드
  const handleTabChange = useCallback(
    (value: string) => {
      const tabValue = value as TabValue;
      setActiveTab(tabValue);
      loadBooks(tabValue);
    },
    [loadBooks]
  );

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">인기 대출 도서</h3>
        </div>
        <Link href="/explore/popular" className="hidden sm:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            전체 보기
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs sm:text-sm gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 탭 콘텐츠 */}
        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-3">
            {/* 설명 */}
            <p className="text-xs text-muted-foreground mb-3">{tab.description}</p>

            {/* 로딩 상태 */}
            {loadingMap[tab.value] && (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[140px] sm:w-[160px] shrink-0">
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                    <Skeleton className="h-3 w-1/2 mt-1" />
                  </div>
                ))}
              </div>
            )}

            {/* 에러 상태 */}
            {!loadingMap[tab.value] && errorMap[tab.value] && booksMap[tab.value].length === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="text-sm">{errorMap[tab.value]}</span>
              </div>
            )}

            {/* 도서 목록 */}
            {!loadingMap[tab.value] && booksMap[tab.value].length > 0 && (
              <div
                className={cn(
                  "flex gap-3 overflow-x-auto pb-2",
                  "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
                  "-mx-1 px-1" // 스크롤 시 카드 그림자 잘림 방지
                )}
              >
                {booksMap[tab.value].map((book) => (
                  <PopularBookCard
                    key={book.isbn13}
                    book={book}
                    variant="compact"
                    showTrending={tab.value === "trending"}
                    showMania={tab.value === "mania"}
                    showAddButton={isAuthenticated}
                  />
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {!loadingMap[tab.value] && !errorMap[tab.value] && booksMap[tab.value].length === 0 && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <span className="text-sm">표시할 도서가 없습니다.</span>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 모바일 전체 보기 */}
      <Link href="/explore/popular" className="sm:hidden block">
        <Button variant="outline" size="sm" className="w-full">
          전체 보기
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>

      {/* 데이터 출처 안내 */}
      <p className="text-[10px] text-muted-foreground text-center">
        출처: 도서관 정보나루 (전국 공공도서관 대출 데이터)
      </p>
    </div>
  );
}
