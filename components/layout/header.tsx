"use client";

import { User, Trees, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/app/actions/auth";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { LanguageToggle } from "@/components/ui/language-toggle";

/**
 * 헤더 컴포넌트
 * 로고, 테마 토글, 알림, 프로필 메뉴 포함
 */
export function Header() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    avatar_url: string | null;
    is_admin?: boolean;
  } | null>(null);

  const prevPathnameRef = useRef(pathname);
  const profileFetchedRef = useRef(false);

  // 테마 관련 hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 프로필 정보 fetch 함수 (useCallback으로 메모이제이션)
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

  // 사용자 프로필 정보 가져오기 (user 변경 시에만)
  useEffect(() => {
    if (!profileFetchedRef.current || !user) {
      fetchProfile();
      profileFetchedRef.current = true;
    }
  }, [user, fetchProfile]);

  // 프로필 페이지에서 돌아올 때만 프로필 정보 갱신
  useEffect(() => {
    const wasOnProfile = prevPathnameRef.current === "/profile";
    const isLeavingProfile = wasOnProfile && pathname !== "/profile";
    prevPathnameRef.current = pathname;

    if (isLeavingProfile && user) {
      fetchProfile();
    }
  }, [pathname, user, fetchProfile]);

  const userName =
    userProfile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    t("common.user");
  const userAvatar = userProfile?.avatar_url || null;
  const isDarkMode = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 sm:h-16 items-center justify-between px-2 sm:px-4">
        {/* 로고 - 모바일에서만 표시 */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base"
        >
          <Trees className="w-5 h-5 sm:w-6 sm:h-6 text-forest-600 shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-none">ReadTree</span>
        </Link>

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          <TooltipProvider>
            {/* 언어 토글 */}
            <LanguageToggle />

            {/* 테마 토글 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleThemeToggle}
                  aria-label={isDarkMode ? t("theme.switchToLight") : t("theme.switchToDark")}
                >
                  {mounted && isDarkMode ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mounted && isDarkMode ? t("theme.lightMode") : t("theme.darkMode")}</p>
              </TooltipContent>
            </Tooltip>

            {/* 프로필 메뉴 */}
            {user ? (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0"
                        aria-label={t("nav.profile")}
                      >
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
                          <AvatarImage
                            src={userAvatar || undefined}
                            alt={userName}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-xs sm:text-sm bg-primary text-primary-foreground">
                            {userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t("nav.profile")}</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{t("nav.profile")}</span>
                      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        // 로그아웃 전 클라이언트 로컬 데이터 정리
                        localStorage.removeItem("onboarding_tutorial_completed");
                        await signOut();
                      } catch (error) {
                        // NEXT_REDIRECT는 Next.js의 정상적인 리다이렉트 메커니즘이므로 무시
                        if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
                          return;
                        }
                        console.error("로그아웃 오류:", error);
                      }
                    }}
                  >
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link href="/login">{t("common.login")}</Link>
              </Button>
            )}
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
