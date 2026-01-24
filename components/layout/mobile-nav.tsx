"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search, Bot, Eye, Menu } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MobileMenuSheet } from "./mobile-menu-sheet";

/**
 * 모바일 네비게이션 아이템 타입
 */
interface MobileNavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  action?: "menu";
}

/**
 * 로그인 사용자용 모바일 네비게이션 아이템 목록
 */
const loggedInNavItems: MobileNavItem[] = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Library, label: "서재", href: "/books" },
  { icon: Bot, label: "AI", href: "/chat" },
  { icon: Search, label: "검색", href: "/search" },
  { icon: Menu, label: "더보기", action: "menu" },
];

/**
 * 비로그인 사용자용 모바일 네비게이션 아이템 목록
 */
const guestNavItems: MobileNavItem[] = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Eye, label: "샘플", href: "/sample" },
  { icon: Search, label: "검색", href: "/search" },
  { icon: Menu, label: "더보기", action: "menu" },
];

/**
 * 모바일 하단 네비게이션 컴포넌트
 * 모바일에서만 표시되는 하단 고정 네비게이션
 */
export function MobileNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 로그인 상태에 따라 다른 네비게이션 아이템 사용
  const mobileNavItems = user ? loggedInNavItems : guestNavItems;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg lg:hidden"
        aria-label="모바일 네비게이션"
      >
        <div className="flex items-center justify-around h-14 sm:h-16 safe-area-inset-bottom" role="list">
          {mobileNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href
              ? pathname === item.href || pathname.startsWith(item.href + "/")
              : false;
            const key = item.href || `action-${item.action}-${index}`;

            // action이 있는 경우 버튼으로 처리
            if (item.action === "menu") {
              return (
                <button
                  key={key}
                  onClick={() => setIsMenuOpen(true)}
                  className="flex-1 min-h-[44px]"
                  aria-label={item.label}
                >
                  <div
                    className={cn(
                      "w-full flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1 rounded-none touch-manipulation",
                      "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    <span className="text-[10px] sm:text-xs leading-tight">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            }

            return (
              <Link
                key={key}
                href={item.href!}
                className="flex-1 min-h-[44px]"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex flex-col items-center justify-center h-full gap-0.5 sm:gap-1 rounded-none touch-manipulation",
                    isActive && "text-primary bg-secondary/50"
                  )}
                  aria-label={item.label}
                  aria-pressed={isActive}
                >
                  <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isActive && "text-primary")} aria-hidden="true" />
                  <span className={cn("text-[10px] sm:text-xs leading-tight", isActive && "text-primary font-medium")}>
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 더보기 메뉴 바텀시트 */}
      <MobileMenuSheet open={isMenuOpen} onOpenChange={setIsMenuOpen} />
    </>
  );
}

