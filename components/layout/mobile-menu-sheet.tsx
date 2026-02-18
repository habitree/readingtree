"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Clock,
  Users,
  Sparkles,
  Trees,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/use-auth";
import { getCurrentUserProfile } from "@/app/actions/profile";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 모바일 더보기 메뉴 (바텀시트)
 * 프로필, 타임라인, 독서모임, 페르소나, 관리자, 테마 토글 포함
 * 외부 터치로 닫힘
 */
export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<{ is_admin?: boolean } | null>(
    null
  );

  // 테마 관련 hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    if (user) {
      getCurrentUserProfile()
        .then((profile) => {
          setUserProfile(profile || null);
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
  const isDarkMode = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  // 메뉴 아이템 클릭 시 시트 닫기
  const handleMenuClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[50vh] rounded-t-3xl px-0 pb-safe-area-inset-bottom"
        hideCloseButton
      >
        {/* 드래그 인디케이터 */}
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        <SheetHeader className="sr-only">
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>

        <div className="space-y-1 px-4 pb-6">
          {/* 비로그인 사용자용 인라인 배너 */}
          {!user && (
            <SheetClose asChild>
              <Link href="/login" onClick={handleMenuClick}>
                <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-sm text-muted-foreground">ReadTree를 체험 중이에요</span>
                  <span className="text-sm font-medium text-primary">로그인</span>
                </div>
              </Link>
            </SheetClose>
          )}

          {/* 타임라인, 독서모임, 독서 성향 (모든 사용자) */}
          <SheetClose asChild>
            <Link href="/timeline" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/timeline" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/timeline" && "bg-secondary font-medium"
                )}
              >
                <Clock className="h-5 w-5" />
                <span>타임라인</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/groups" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/groups" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/groups" && "bg-secondary font-medium"
                )}
              >
                <Users className="h-5 w-5" />
                <span>독서모임</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/persona" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/persona" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/persona" && "bg-secondary font-medium"
                )}
              >
                <Sparkles className="h-5 w-5" />
                <span>독서 성향</span>
              </Button>
            </Link>
          </SheetClose>

          {/* 관리자 (관리자만) */}
          {isAdmin && (
            <SheetClose asChild>
              <Link href="/admin" onClick={handleMenuClick}>
                <Button
                  variant={
                    pathname.startsWith("/admin") ? "secondary" : "ghost"
                  }
                  className={cn(
                    "w-full justify-start gap-3 h-12",
                    pathname.startsWith("/admin") &&
                      "bg-secondary font-medium"
                  )}
                >
                  <Trees className="h-5 w-5" />
                  <span>관리자</span>
                </Button>
              </Link>
            </SheetClose>
          )}

          <Separator className="my-3" />

          {/* 설정 섹션 */}
          <div className="flex items-center justify-between h-12 px-4 rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              {mounted && isDarkMode ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span>다크모드</span>
            </div>
            {mounted && (
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
                aria-label="다크모드 전환"
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
