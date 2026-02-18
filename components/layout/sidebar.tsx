"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Library,
  Search,
  Clock,
  Users,
  User,
  Trees,
  Bot,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { BookshelfTree } from "./bookshelf-tree";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { useEffect, useState, useCallback } from "react";

/**
 * 사이드바 네비게이션 아이템 타입
 */
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
  adminOnly?: boolean;
}

/**
 * 핵심 네비게이션 아이템 (항상 표시)
 */
const primaryItems: SidebarItem[] = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Library, label: "내 서재", href: "/books" },
  { icon: Search, label: "검색", href: "/search" },
  { icon: Clock, label: "타임라인", href: "/timeline" },
  { icon: User, label: "프로필", href: "/profile" },
];

/**
 * 더보기 네비게이션 아이템 (접이식)
 */
const secondaryItems: SidebarItem[] = [
  { icon: Users, label: "독서모임", href: "/groups" },
  { icon: Bot, label: "AI 도우미", href: "/chat" },
  { icon: Trees, label: "관리자", href: "/admin", adminOnly: true },
];


/**
 * 사이드바 컴포넌트
 * 데스크톱에서 고정 사이드바로 표시
 * 핵심 5개 메뉴 + 더보기 접이식 그룹
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ is_admin?: boolean } | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile || null);
    } catch (error) {
      console.error("프로필 조회 오류:", error);
      setUserProfile(null);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isAdmin = userProfile?.is_admin === true;

  // 더보기 영역의 항목이 활성화되어 있으면 자동으로 열기
  useEffect(() => {
    const isSecondaryActive = secondaryItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (isSecondaryActive) {
      setIsMoreOpen(true);
    }
  }, [pathname]);

  const renderNavItem = useCallback((item: SidebarItem) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

    // "내 서재" 항목은 서재 트리로 대체
    if (item.href === "/books" && user) {
      return null;
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
      >
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 h-11",
            isActive && "bg-secondary font-medium"
          )}
          aria-label={item.label}
          aria-pressed={isActive}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge variant="secondary" className="ml-auto" aria-label={`${item.badge}개의 알림`}>
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  }, [pathname, user]);

  const visibleSecondaryItems = secondaryItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-background lg:z-50"
      aria-label="주요 네비게이션"
    >
      <div className="flex flex-col flex-1 pt-6 pb-4 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center flex-shrink-0 px-6 mb-8 gap-2 hover:opacity-80 transition-opacity duration-200"
          aria-label="홈으로 이동"
        >
          <Trees className="w-8 h-8 text-forest-600" />
          <h1 className="text-xl font-bold">ReadTree</h1>
        </Link>
        <nav className="flex-1 px-3 space-y-1" aria-label="메인 메뉴">
          {/* 핵심 메뉴 */}
          {primaryItems.map(renderNavItem)}

          {/* 서재 트리 (로그인 사용자만) */}
          {user && <BookshelfTree />}

          {/* 더보기 접이식 그룹 */}
          {visibleSecondaryItems.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex items-center gap-2 px-3 py-2 w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-expanded={isMoreOpen}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isMoreOpen && "rotate-180"
                  )}
                />
                <span>더보기</span>
              </button>
              {isMoreOpen && (
                <div className="space-y-1">
                  {visibleSecondaryItems.map(renderNavItem)}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

