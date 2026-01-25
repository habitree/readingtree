"use client";

import { Megaphone, User, Trees, Trash2, AlertTriangle } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { signOut, deleteAccount } from "@/app/actions/auth";
import { getCurrentUserProfile } from "@/app/actions/profile";
import { getImageUrl } from "@/lib/utils/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";


/**
 * 헤더 컴포넌트
 * 로고, 검색, 알림, 프로필 메뉴 포함
 */
export function Header() {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; avatar_url: string | null; is_admin?: boolean } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "계정삭제") {
      setDeleteError("확인 문구를 정확히 입력해주세요.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteAccount(deleteConfirmText);
    } catch (error) {
      console.error("계정 삭제 오류:", error);
      setDeleteError(
        error instanceof Error ? error.message : "계정 삭제에 실패했습니다."
      );
      setIsDeleting(false);
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setDeleteConfirmText("");
    setDeleteError(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 sm:h-16 items-center justify-between px-2 sm:px-4">
        {/* 로고 - 모바일에서만 표시, 아이콘만 표시하여 공간 절약 */}
        <Link href="/" className="lg:hidden flex items-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base">
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
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    계정 삭제
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

      {/* 계정 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              계정 삭제
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-medium text-destructive">
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="rounded-lg bg-destructive/10 p-3 text-sm space-y-2">
                  <p>계정을 삭제하면 다음 데이터가 영구적으로 삭제됩니다:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>프로필 정보</li>
                    <li>독서 기록 및 메모</li>
                    <li>서재에 등록한 책 정보</li>
                    <li>작성한 리뷰 및 댓글</li>
                  </ul>
                  <p className="font-semibold text-destructive">
                    삭제된 데이터는 복구할 수 없습니다.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-sm">
                    확인을 위해 <span className="font-bold">계정삭제</span>를 입력하세요
                  </Label>
                  <Input
                    id="delete-confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="계정삭제"
                    className="font-mono"
                    disabled={isDeleting}
                  />
                  {deleteError && (
                    <p className="text-sm text-destructive">{deleteError}</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "계정삭제" || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "계정 삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

