"use client";

import { Megaphone, User, Trees } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/app/actions/auth";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { getImageUrl } from "@/lib/utils/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * 관리자 여부 확인
 */
function isAdminUser(user: any): boolean {
  if (!user || !user.email) {
    return false;
  }
  const ADMIN_EMAIL = "cdhnaya@kakao.com";
  return user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * 헤더 컴포넌트
 * 로고, 검색, 알림, 프로필 메뉴 포함
 */
export function Header() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; avatar_url: string | null } | null>(null);
  
  // 사용자 프로필 정보 가져오기
  // user가 변경되거나 프로필 페이지에서 다른 페이지로 이동할 때 갱신
  useEffect(() => {
    if (user) {
      getCurrentUserProfile()
        .then((profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
            // 프로필이 없으면 초기화 (다시 시도)
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
  }, [user, pathname]); // pathname 추가하여 프로필 페이지에서 돌아올 때 갱신

  // 프로필 페이지에서 돌아올 때 강제로 프로필 정보 갱신
  useEffect(() => {
    if (user && pathname !== "/profile") {
      // 프로필 페이지가 아닌 다른 페이지로 이동할 때 프로필 정보 갱신
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
  }, [pathname, user]); // pathname이 변경될 때마다 실행

  const userName = userProfile?.name || user?.user_metadata?.name || user?.email?.split("@")[0] || "사용자";
  const userAvatar = userProfile?.avatar_url || null;
  const isAdmin = isAdminUser(user);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 sm:h-16 items-center justify-between px-2 sm:px-4">
        {/* 로고 - 모바일에서만 표시, 아이콘만 표시하여 공간 절약 */}
        <Link href="/" className="lg:hidden flex items-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base">
          <Trees className="w-5 h-5 sm:w-6 sm:h-6 text-forest-600 shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-none">Habitree</span>
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
                  <Link href="https://habitree.github.io/habitree_pr/#press-release" target="_blank" rel="noopener noreferrer">
                    <Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>새로운 소식</p>
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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        프로필 보기
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      프로필 설정
                      <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">관리자 대시보드</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>설정</DropdownMenuItem>
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
              <Button asChild variant="default">
                <Link href="/login">로그인</Link>
              </Button>
            )}
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}

