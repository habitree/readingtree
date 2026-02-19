"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            문제가 발생했습니다
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "인증 처리 중 오류가 발생했습니다. 다시 시도해주세요."}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button onClick={reset} variant="outline">
            다시 시도
          </Button>
          <Button asChild>
            <a href="/login">로그인으로 돌아가기</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
