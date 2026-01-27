import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogIn, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type GuestAlertVariant = "default" | "compact" | "hero";

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
 * 비로그인 사용자에게 샘플 데이터임을 알리고 로그인을 유도합니다.
 *
 * @example
 * ```tsx
 * // 기본 사용
 * {isGuest && <GuestAlert message="샘플 책 목록을 보고 계십니다" />}
 *
 * // 컴팩트 스타일
 * {isGuest && <GuestAlert variant="compact" />}
 *
 * // 히어로 스타일 (책 상세 페이지)
 * {isGuest && <GuestAlert variant="hero" message="로그인하여 나만의 서재를 만들어보세요!" />}
 * ```
 */
export function GuestAlert({
  message = "현재 샘플 데이터를 보고 계십니다. 로그인하여 시작해보세요!",
  variant = "default",
  className,
  loginLabel = "로그인",
  loginHref = "/login",
}: GuestAlertProps) {
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
            샘플
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
                샘플
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
            <Badge variant="secondary">샘플 데이터</Badge>
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
