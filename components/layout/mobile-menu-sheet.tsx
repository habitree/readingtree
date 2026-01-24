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
  Library,
  BookOpen,
  ChevronRight,
  ChevronDown,
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/hooks/use-auth";
import { getBookshelves } from "@/app/actions/bookshelves";
import { getCurrentUserProfile } from "@/app/actions/profile";
import type { Bookshelf } from "@/types/bookshelf";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 모바일 더보기 메뉴 (바텀시트)
 * 프로필, 서재 트리, 타임라인, 독서모임, 페르소나, 관리자, 테마 토글 포함
 */
export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState<{ is_admin?: boolean } | null>(
    null
  );
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoadingBookshelves, setIsLoadingBookshelves] = useState(true);
  const [isBookshelfExpanded, setIsBookshelfExpanded] = useState(true);

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

  // 서재 목록 가져오기
  useEffect(() => {
    if (user && open) {
      setIsLoadingBookshelves(true);
      getBookshelves()
        .then((data) => {
          setBookshelves(data);
        })
        .catch((error) => {
          console.error("서재 목록 조회 오류:", error);
        })
        .finally(() => {
          setIsLoadingBookshelves(false);
        });
    }
  }, [user, open]);

  const isAdmin = userProfile?.is_admin === true;
  const isDarkMode = theme === "dark";

  const handleThemeToggle = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  // 메뉴 아이템 클릭 시 시트 닫기
  const handleMenuClick = () => {
    onOpenChange(false);
  };

  // 메인 서재와 서브 서재 분리
  const mainBookshelf = bookshelves.find((b) => b.is_main);
  const subBookshelves = bookshelves.filter((b) => !b.is_main);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl px-4 pb-safe-area-inset-bottom"
      >
        <SheetHeader className="pb-2">
          <div className="mx-auto w-12 h-1.5 bg-muted rounded-full mb-2" />
          <SheetTitle className="sr-only">메뉴</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full pb-20 space-y-1">
          {/* 프로필 */}
          {user && (
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
                  <span>프로필</span>
                </Button>
              </Link>
            </SheetClose>
          )}

          <Separator className="my-3" />

          {/* 서재 트리 (로그인 사용자만) */}
          {user && (
            <div className="space-y-1">
              {/* 메인 서재 */}
              {isLoadingBookshelves ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-10 w-full ml-4" />
                  <Skeleton className="h-10 w-full ml-4" />
                </div>
              ) : (
                <>
                  {mainBookshelf && (
                    <SheetClose asChild>
                      <Link href="/books" onClick={handleMenuClick}>
                        <Button
                          variant={pathname === "/books" ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-12",
                            pathname === "/books" && "bg-secondary font-medium"
                          )}
                        >
                          <Library className="h-5 w-5" />
                          <span>{mainBookshelf.name}</span>
                        </Button>
                      </Link>
                    </SheetClose>
                  )}

                  {/* 서브 서재 목록 */}
                  {subBookshelves.length > 0 && (
                    <div className="ml-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 h-10 text-sm text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          setIsBookshelfExpanded(!isBookshelfExpanded)
                        }
                      >
                        {isBookshelfExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span>서재 ({subBookshelves.length})</span>
                      </Button>
                      {isBookshelfExpanded && (
                        <div className="ml-4 space-y-1">
                          {subBookshelves.map((bookshelf) => {
                            const isActive =
                              pathname === `/bookshelves/${bookshelf.id}` ||
                              pathname.startsWith(
                                `/bookshelves/${bookshelf.id}/`
                              );
                            return (
                              <SheetClose asChild key={bookshelf.id}>
                                <Link
                                  href={`/bookshelves/${bookshelf.id}`}
                                  onClick={handleMenuClick}
                                >
                                  <Button
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                      "w-full justify-start gap-2 h-10 text-sm",
                                      isActive && "bg-secondary font-medium"
                                    )}
                                  >
                                    <BookOpen className="h-4 w-4" />
                                    <span className="truncate">
                                      {bookshelf.name}
                                    </span>
                                  </Button>
                                </Link>
                              </SheetClose>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <Separator className="my-3" />
            </div>
          )}

          {/* 타임라인, 독서모임, 페르소나 (로그인 사용자만) */}
          {user && (
            <>
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
                    <span>내 페르소나</span>
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
            </>
          )}

          {/* 비로그인 사용자용 로그인 링크 */}
          {!user && (
            <>
              <SheetClose asChild>
                <Link href="/login" onClick={handleMenuClick}>
                  <Button
                    variant={pathname === "/login" ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-12",
                      pathname === "/login" && "bg-secondary font-medium"
                    )}
                  >
                    <User className="h-5 w-5" />
                    <span>로그인</span>
                  </Button>
                </Link>
              </SheetClose>
              <Separator className="my-3" />
            </>
          )}

          {/* 다크모드 토글 */}
          <div className="flex items-center justify-between h-12 px-4">
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
