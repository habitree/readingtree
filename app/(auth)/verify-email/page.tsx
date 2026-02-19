"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

/**
 * 이메일 인증 확인 페이지
 * 이메일 인증 링크 클릭 후 리다이렉트되는 페이지
 */
export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>(() => t("verifyEmail.loadingMessage"));

  useEffect(() => {
    // URL 파라미터 확인
    const token = searchParams.get("token");
    const type = searchParams.get("type");

    if (!token) {
      setStatus("error");
      setMessage(t("verifyEmail.errorNoToken"));
      return;
    }

    // 인증 성공으로 간주 (실제로는 /callback에서 처리됨)
    // 이 페이지는 사용자에게 안내만 제공
    setStatus("success");
    setMessage(t("verifyEmail.successMessage"));

    // 2초 후 메인 페이지로 리다이렉트
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, router, t]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("verifyEmail.title")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("verifyEmail.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
              </>
            )}
          </div>

          {status === "error" && (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/signup">{t("verifyEmail.retrySignup")}</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">{t("verifyEmail.goToLogin")}</Link>
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">{t("verifyEmail.goHome")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

