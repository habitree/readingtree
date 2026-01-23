import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogIn, Eye } from "lucide-react";
import Link from "next/link";
import { SampleBookshelfContent } from "@/components/books/sample-bookshelf-content";
import type { ReadingStatus } from "@/types/book";

export const metadata: Metadata = {
  title: "샘플 서재 | ReadTree",
  description: "AI 서재 기능을 미리 체험해보세요",
};

interface SamplePageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }> | {
    status?: string;
    q?: string;
  };
}

/**
 * 샘플 서재 페이지
 * 비로그인 사용자가 특정 사용자의 서재를 미리 볼 수 있음
 */
export default async function SamplePage({ searchParams }: SamplePageProps) {
  try {
    const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));

    const status = (resolvedSearchParams.status as ReadingStatus | undefined) || undefined;
    const query = resolvedSearchParams.q || undefined;

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* 샘플 서재 안내 배너 */}
        <Card className="border-forest-500/30 bg-forest-50/50 dark:bg-forest-950/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-forest-100 dark:bg-forest-900">
                  <Eye className="h-5 w-5 text-forest-600 dark:text-forest-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-forest-700 dark:text-forest-300">
                    샘플 서재를 둘러보세요
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    AI 독서 도우미와 함께하는 서재 기능을 미리 체험해보세요. 로그인하면 나만의 서재를 만들 수 있어요!
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="shrink-0">
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 페이지 타이틀 */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            샘플 서재
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            다른 사용자의 서재를 구경하고 기능을 체험해보세요
          </p>
        </div>

        {/* 샘플 컨텐츠 */}
        <SampleBookshelfContent status={status} query={query} />
      </div>
    );
  } catch (error) {
    console.error("SamplePage 렌더링 오류:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">샘플 서재</h1>
          <p className="text-muted-foreground">
            페이지를 불러오는 중 오류가 발생했습니다.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
            </p>
            <Button asChild className="mt-4">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
