"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmail, signInWithKakao, signInWithGoogle } from "@/app/actions/auth";
import { SocialLoginButtons } from "./social-login-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ChevronDown, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation, type TranslationKey } from "@/lib/i18n";

const createLoginFormSchema = (t: (key: TranslationKey) => string) =>
  z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });

type LoginFormValues = z.infer<ReturnType<typeof createLoginFormSchema>>;

/**
 * 로그인 폼 컴포넌트
 * 소셜 로그인 버튼과 이메일/비밀번호 로그인을 모두 지원
 */
export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"kakao" | "google" | "email" | null>(null);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(createLoginFormSchema(t)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 이메일 로그인 핸들러
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading("email");
      await signInWithEmail(data.email, data.password);
      // redirect()가 성공하면 여기까지 도달하지 않음
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        return;
      }

      console.error("이메일 로그인 오류:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : t("auth.loginFailed")
      );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          ReadTree
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 소셜 로그인 버튼 (최우선) */}
        <div className="space-y-3">
          <SocialLoginButtons />
          <p className="text-xs text-center text-muted-foreground">
            {t("auth.quickestWay")}
          </p>
        </div>

        {/* 이메일 로그인 접이식 */}
        <div>
          <button
            type="button"
            onClick={() => setShowEmailLogin(!showEmailLogin)}
            className="flex items-center justify-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
          >
            <span>{t("auth.otherLoginMethods")}</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showEmailLogin ? "rotate-180" : ""}`} />
          </button>

          {showEmailLogin && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-3">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  disabled={isLoading !== null}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("auth.password")}
                  disabled={isLoading !== null}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={isLoading !== null}
              >
                {isLoading === "email" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("auth.loggingIn")}
                  </>
                ) : (
                  t("auth.login")
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {t("auth.loginTermsNotice")}
        </p>

        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("auth.dontHaveAccount")}{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              {t("auth.signup")}
            </Link>
          </p>

          <Separator />

          <div>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              <Eye className="mr-2 h-4 w-4" />
              {t("auth.browseAsGuest")}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              {t("auth.browseAsGuestDesc")}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground hover:underline">
              {t("auth.termsOfService")}
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              {t("auth.privacyPolicy")}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

