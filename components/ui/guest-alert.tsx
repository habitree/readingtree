"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogIn, Sparkles, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type GuestAlertVariant = "default" | "compact" | "hero" | "inline-banner";

interface GuestAlertProps {
  /** 표시할 메시지 */
  message?: string;
  /** 변형 스타일 */
  variant?: GuestAlertVariant;
  /** 추가 클래스 */
  className?: string;
  /** 로그인 버튼 라벨 */
  loginLabel?: string;
  /** 로그인 링크 (기본: /login) */
  loginHref?: string;
}

/**
 * 게스트 사용자 안내 컴포넌트
 *
 * @example
 * ```tsx
 * {isGuest && <GuestAlert variant="inline-banner" />}
 * ```
 */
export function GuestAlert({
  message = "ReadTree를 미리 둘러보고 있어요",
  variant = "default",
  className,
  loginLabel = "로그인",
  loginHref = "/login",
}: GuestAlertProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== "undefined" && variant === "inline-banner") {
      return sessionStorage.getItem("guest-banner-dismissed") === "true";
    }
    return false;
  });

  if (variant === "inline-banner") {
    if (dismissed) return null;

    return (
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-lg",
          "bg-primary/5 border border-primary/10",
          className
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground truncate">체험 중이에요</span>
          <Link
            href={loginHref}
            className="text-sm font-medium text-primary hover:underline shrink-0"
          >
            {loginLabel}
          </Link>
        </div>
        <button
          onClick={() => {
            setDismissed(true);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("guest-banner-dismissed", "true");
            }
          }}
          className="shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
          aria-label="닫기"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 p-3 rounded-lg",
          "bg-primary/5 border border-primary/10",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            체험하기
          </Badge>
          <span className="text-sm text-muted-foreground">{message}</span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={loginHref}>
            <LogIn className="mr-1.5 h-3.5 w-3.5" />
            {loginLabel}
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <Card
        className={cn(
          "border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 overflow-hidden relative",
          className
        )}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <CardContent className="py-4 sm:py-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-white/80 dark:bg-slate-800/80 shadow-sm"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                체험하기
              </Badge>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <Button asChild size="sm" className="shadow-sm">
              <Link href={loginHref}>
                <LogIn className="mr-2 h-4 w-4" />
                시작하기
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // default variant
  return (
    <Card className={cn("border-primary/20 bg-primary/5", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">체험하기</Badge>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <Button asChild size="sm">
            <Link href={loginHref}>
              <LogIn className="mr-2 h-4 w-4" />
              {loginLabel}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
