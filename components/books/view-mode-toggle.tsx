"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Grid3x3, Table2, Loader2, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "table";

interface ViewModeToggleProps {
  className?: string;
}

/**
 * 표현 방식 토글 컴포넌트
 * 그리드/테이블 형태 전환
 * 모바일에서는 테이블 옵션 숨김 (lg 이상에서만 표시)
 */
export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isMobile, setIsMobile] = useState(true);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg 브레이크포인트
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  
  // 현재 경로에 따라 기본 경로 결정 (서재 개별 페이지인지 확인)
  const basePath = pathname?.startsWith("/bookshelves/") ? pathname : "/books";
  
  // URL 파라미터에서 view 값을 가져오고, 없으면 기본값 "grid" 사용
  const currentView = (searchParams.get("view") as ViewMode) || "grid";

  const handleViewChange = (view: ViewMode) => {
    if (view === currentView) return; // 같은 뷰면 변경하지 않음
    
    const params = new URLSearchParams(searchParams.toString());
    // 명시적으로 view 파라미터 설정
    params.set("view", view);
    
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  };

  return (
    <div className={cn("inline-flex items-center rounded-full bg-muted p-0.5", className)}>
      <button
        type="button"
        onClick={() => handleViewChange("grid")}
        disabled={isPending}
        aria-label="그리드 보기"
        className={cn(
          "inline-flex items-center justify-center rounded-full h-7 w-7 transition-all",
          currentView === "grid"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isPending && currentView !== "grid" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Grid3x3 className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        onClick={() => handleViewChange("table")}
        disabled={isPending}
        aria-label={isMobile ? "리스트 보기" : "테이블 보기"}
        className={cn(
          "inline-flex items-center justify-center rounded-full h-7 w-7 transition-all",
          currentView === "table"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {isPending && currentView !== "table" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isMobile ? (
          <List className="h-3.5 w-3.5" />
        ) : (
          <Table2 className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

