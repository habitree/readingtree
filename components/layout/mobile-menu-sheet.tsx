"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Users,
  Bot,
  Lightbulb,
  Sparkles,
  Trees,
  Moon,
  Sun,
  User,
  BarChart3,
  StickyNote,
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
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 테마 관련 hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = profile?.is_admin === true;
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
          <SheetTitle>{t("nav.menu")}</SheetTitle>
        </SheetHeader>

        <div className="space-y-1 px-4 pb-6">
          {/* 비로그인 사용자용 인라인 배너 */}
          {!user && (
            <SheetClose asChild>
              <Link href="/login" onClick={handleMenuClick}>
                <div className="flex items-center justify-between px-3 py-2 mb-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-sm text-muted-foreground">{t("nav.exploringReadTree")}</span>
                  <span className="text-sm font-medium text-primary">{t("common.login")}</span>
                </div>
              </Link>
            </SheetClose>
          )}

          {/* 내 기록, 검색, 프로필, 독서모임, AI 도우미 */}
          <SheetClose asChild>
            <Link href="/notes" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/notes" || pathname.startsWith("/notes?") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/notes" && "bg-secondary font-medium"
                )}
              >
                <StickyNote className="h-5 w-5" />
                <span>{t("notes.myNotes")}</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/search" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/search" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/search" && "bg-secondary font-medium"
                )}
              >
                <Search className="h-5 w-5" />
                <span>{t("nav.search")}</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/profile" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/profile" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/profile" && "bg-secondary font-medium"
                )}
              >
                <User className="h-5 w-5" />
                <span>{t("nav.profile")}</span>
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
                <span>{t("nav.groups")}</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/stats" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/stats" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/stats" && "bg-secondary font-medium"
                )}
              >
                <BarChart3 className="h-5 w-5" />
                <span>{t("persona.pageTitle")}</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/chat" onClick={handleMenuClick}>
              <Button
                variant={pathname === "/chat" ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname === "/chat" && "bg-secondary font-medium"
                )}
              >
                <Bot className="h-5 w-5" />
                <span>{t("nav.aiChat")}</span>
              </Button>
            </Link>
          </SheetClose>

          <SheetClose asChild>
            <Link href="/feature-requests" onClick={handleMenuClick}>
              <Button
                variant={pathname.startsWith("/feature-requests") ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  pathname.startsWith("/feature-requests") && "bg-secondary font-medium"
                )}
              >
                <Lightbulb className="h-5 w-5" />
                <span>{t("nav.featureRequests")}</span>
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
                  <span>{t("nav.admin")}</span>
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
              <span>{t("theme.darkModeToggle")}</span>
            </div>
            {mounted && (
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
                aria-label={t("theme.darkModeSwitch")}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
