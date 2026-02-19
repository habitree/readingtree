"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // 에러 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.error("에러 발생:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t("errorBoundary.pageTitle")}</CardTitle>
          <CardDescription>
            {t("errorBoundary.pageDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && error.message ? (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">{t("errorBoundary.errorDetail")}</p>
              <p className="text-xs text-muted-foreground break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  {t("errorBoundary.errorId")} {error.digest}
                </p>
              )}
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("errorBoundary.retry")}
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              {t("errorBoundary.goHome")}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {t("errorBoundary.helpText")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

