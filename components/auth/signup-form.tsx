"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signUpWithEmail, signInWithKakao, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";

const signupFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  passwordConfirm: z.string().min(8, "Please confirm your password."),
  name: z.string().min(1, "Please enter your name.").max(100, "Name must be 100 characters or less."),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Service.",
  }),
  privacyAgreed: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Privacy Policy.",
  }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords do not match.",
  path: ["passwordConfirm"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

/**
 * 회원가입 폼 컴포넌트
 * 카카오, 구글 소셜 회원가입과 이메일 회원가입을 모두 지원
 */
export function SignupForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<"kakao" | "google" | "email" | null>(null);
  const [emailSignupSuccess, setEmailSignupSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      name: "",
      termsAgreed: false,
      privacyAgreed: false,
    },
  });

  // 소셜 회원가입 핸들러
  const handleKakaoSignup = async () => {
    try {
      setIsLoading("kakao");
      await signInWithKakao();
      // redirect()가 성공하면 여기까지 도달하지 않음
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        return;
      }

      console.error("Kakao signup error:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : t("signup.kakaoFailed")
      );
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading("google");
      await signInWithGoogle();
      // redirect()가 성공하면 여기까지 도달하지 않음
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("NEXT_REDIRECT") || errorMessage.includes("redirect")) {
        return;
      }

      console.error("Google signup error:", error);
      setIsLoading(null);
      toast.error(
        error instanceof Error
          ? error.message
          : t("signup.googleFailed")
      );
    }
  };

  // 이메일 회원가입 핸들러
  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading("email");
      const result = await signUpWithEmail(data.email, data.password, data.name);

      if (result.success) {
        setEmailSignupSuccess(true);
        toast.success(result.message);
      }
    } catch (error) {
      console.error("Email signup error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("signup.emailFailed")
      );
      setIsLoading(null);
    }
  };

  // 이메일 인증 대기 화면
  if (emailSignupSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t("signup.emailCheckTitle")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("signup.emailCheckDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("signup.emailSent")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("signup.emailVerify")}
            </p>
          </div>
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              {t("signup.goToLogin")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          ReadTree
        </CardTitle>
        <CardDescription className="text-center">
          {t("signup.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 소셜 회원가입 버튼 */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleKakaoSignup}
            disabled={isLoading !== null}
            className="w-full bg-[#FEE500] text-[#000000] hover:bg-[#FEE500]/90"
            size="lg"
          >
            {isLoading === "kakao" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("signup.processing")}
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M9 0C4.03 0 0 3.27 0 7.3c0 2.55 1.7 4.8 4.25 6.05L3.5 17.5l4.5-2.45c.5.05 1 .1 1.5.1 4.97 0 9-3.27 9-7.3S13.97 0 9 0z"
                    fill="#000000"
                  />
                </svg>
                {t("signup.signupWithKakao")}
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading !== null}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isLoading === "google" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("signup.processing")}
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2"
                >
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.186l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.705c-.18-.54-.282-1.117-.282-1.705s.102-1.165.282-1.705V4.963H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.037l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.963L3.964 7.295C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                {t("signup.signupWithGoogle")}
              </>
            )}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
          </div>
        </div>

        {/* 이메일 회원가입 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              placeholder={t("signup.passwordMinHint")}
              disabled={isLoading !== null}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">{t("auth.confirmPassword")}</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder={t("signup.passwordConfirmPlaceholder")}
              disabled={isLoading !== null}
              {...register("passwordConfirm")}
            />
            {errors.passwordConfirm && (
              <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("profile.displayName")}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t("auth.namePlaceholder")}
              disabled={isLoading !== null}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={isLoading !== null}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...register("termsAgreed")}
              />
              <div className="flex-1">
                <span className="text-sm">
                  {t("signup.termsAgreePrefix")}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("auth.termsOfService")}
                  </Link>
                  {t("signup.termsAgreeSuffix")} <span className="text-destructive">{t("signup.required")}</span>
                </span>
              </div>
            </label>
            {errors.termsAgreed && (
              <p className="text-xs text-destructive ml-7">{errors.termsAgreed.message}</p>
            )}

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={isLoading !== null}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                {...register("privacyAgreed")}
              />
              <div className="flex-1">
                <span className="text-sm">
                  {t("signup.termsAgreePrefix")}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("signup.privacyPolicy")}
                  </Link>
                  {t("signup.termsAgreeSuffix")} <span className="text-destructive">{t("signup.required")}</span>
                </span>
              </div>
            </label>
            {errors.privacyAgreed && (
              <p className="text-xs text-destructive ml-7">{errors.privacyAgreed.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading !== null}
          >
            {isLoading === "email" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("signup.processing")}
              </>
            ) : (
              t("auth.signup")
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
