"use client";

import { Megaphone, User, Trees, Moon, Sun } from "lucide-react";
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
import { getImageUrl } from "@/lib/utils/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * 헤더 컴포넌트
 * 로고, 테마 토글, 알림, 프로필 메뉴 포함
 */
export function Header() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    avatar_url: string | null;
    is_admin?: boolean;
  } | null>(null);

  // 테마 관련 hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 사용자 프로필 정보 가져오기
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
  }, [user, pathname]);

  // 프로필 페이지에서 돌아올 때 강제로 프로필 정보 갱신
  useEffect(() => {
    if (user && pathname !== "/profile") {
      getCurrentUserProfile()
        .then((profile) => {
          if (profile) {
            setUserProfile(profile);
          }
        })
        .catch((error) => {
          console.error("프로필 갱신 오류:", error);
        });
    }
  }, [pathname, user]);

  const userName =
    userProfile?.name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "사용자";
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
            {/* 새로운 소식 (보도자료) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-10 sm:w-10"
                  asChild
                  aria-label="새로운 소식"
                >
                  <Link
                    href="https://habitree.github.io/habitree_pr/#press-release"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>새로운 소식</p>
              </TooltipContent>
            </Tooltip>

            {/* 테마 토글 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 sm:h-10 sm:w-10"
                  onClick={handleThemeToggle}
                  aria-label={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
                >
                  {mounted && isDarkMode ? (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{mounted && isDarkMode ? "라이트 모드" : "다크 모드"}</p>
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
                        aria-label="프로필"
                      >
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border-2 border-background">
                          <AvatarImage
                            src={getImageUrl(userAvatar)}
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
                    <p>프로필</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>프로필</span>
                      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await signOut();
                      } catch (error) {
                        console.error("로그아웃 오류:", error);
                      }
                    }}
                  >
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/sample">샘플보기</Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link href="/login">로그인</Link>
                </Button>
              </div>
            )}
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
