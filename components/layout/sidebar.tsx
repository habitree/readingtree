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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { BookshelfTree } from "./bookshelf-tree";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { useEffect, useState } from "react";

/**
 * 사이드바 네비게이션 아이템 타입
 */
interface SidebarItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
  adminOnly?: boolean; // 관리자만 볼 수 있는 항목
}

/**
 * 사이드바 네비게이션 아이템 목록
 * software_design.md 5.2.2 참고
 */
const sidebarItems: SidebarItem[] = [
  { icon: Home, label: "홈", href: "/" },
  { icon: Library, label: "내 서재", href: "/books" },
  { icon: Search, label: "검색", href: "/search" },
  { icon: Clock, label: "타임라인", href: "/timeline" },
  { icon: Users, label: "독서모임", href: "/groups" },
  { icon: User, label: "프로필", href: "/profile" },
  { icon: Trees, label: "관리자", href: "/admin", adminOnly: true },
];


/**
 * 사이드바 컴포넌트
 * 데스크톱에서 고정 사이드바로 표시
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<{ is_admin?: boolean } | null>(null);

  // 사용자 프로필 정보 가져오기 (is_admin 포함)
  useEffect(() => {
    if (user) {
      getCurrentUserProfile()
        .then((profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
        })
        .catch((error) => {
          console.error("프로필 조회 오류:", error);
          setUserProfile(null);
        });
    } else {
      setUserProfile(null);
    }
  }, [user]);

  const isAdmin = userProfile?.is_admin === true;

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-background lg:z-50"
      aria-label="주요 네비게이션"
    >
      <div className="flex flex-col flex-1 pt-6 pb-4 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center flex-shrink-0 px-6 mb-8 gap-2 hover:opacity-80 transition-opacity"
          aria-label="홈으로 이동"
        >
          <Trees className="w-8 h-8 text-forest-600" />
          <h1 className="text-xl font-bold">Habitree</h1>
        </Link>
        <nav className="flex-1 px-3 space-y-1" aria-label="메인 메뉴">
          {sidebarItems
            .filter((item) => !item.adminOnly || isAdmin) // 관리자 전용 항목 필터링
            .map((item) => {
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
            })}
          
          {/* 서재 트리 (로그인 사용자만) */}
          {user && <BookshelfTree />}
        </nav>
      </div>
    </aside>
  );
}

