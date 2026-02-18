"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogIn, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

/**
 * 로그인 유도 모달
 * 모바일: 바텀시트, 데스크톱: Dialog
 * 게스트 사용자가 로그인 필요 기능 사용 시 표시
 */
export function LoginPromptModal({
  open,
  onOpenChange,
  title = "로그인이 필요해요",
  description = "이 기능을 사용하려면 로그인해주세요.",
}: LoginPromptModalProps) {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const handleLogin = useCallback(() => {
    onOpenChange(false);
    router.push(`/login?redirectedFrom=${encodeURIComponent(currentPath)}`);
  }, [router, onOpenChange, currentPath]);

  const handleKakaoLogin = useCallback(() => {
    onOpenChange(false);
    router.push(`/login?provider=kakao&redirectedFrom=${encodeURIComponent(currentPath)}`);
  }, [router, onOpenChange, currentPath]);

  const handleGoogleLogin = useCallback(() => {
    onOpenChange(false);
    router.push(`/login?provider=google&redirectedFrom=${encodeURIComponent(currentPath)}`);
  }, [router, onOpenChange, currentPath]);

  const content = (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleKakaoLogin}
          className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD800] text-[#191919] font-medium"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          카카오로 시작하기
        </Button>
        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full h-12 font-medium"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google로 시작하기
        </Button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">또는</span>
        </div>
      </div>
      <Button
        variant="ghost"
        onClick={() => onOpenChange(false)}
        className="w-full h-11 text-muted-foreground"
      >
        둘러보기 계속하기
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pb-8 pt-4"
          swipeToClose
          hideCloseButton
        >
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6" />
          <SheetHeader className="mb-6">
            <SheetTitle className="text-center text-lg">{title}</SheetTitle>
            <SheetDescription className="text-center">
              {description}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
