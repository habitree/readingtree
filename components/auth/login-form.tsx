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
import { Loader2 } from "lucide-react";
import Link from "next/link";

const loginFormSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

/**
 * 로그인 폼 컴포넌트
 * 소셜 로그인 버튼과 이메일/비밀번호 로그인을 모두 지원
 */
export function LoginForm() {
  const [isLoading, setIsLoading] = useState<"kakao" | "google" | "email" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
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
          : "로그인에 실패했습니다. 다시 시도해주세요."
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
        {/* 소셜 로그인 버튼 */}
        <SocialLoginButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
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
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
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
                로그인 중...
              </>
            ) : (
              "로그인"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          로그인 시 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
        </p>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>

        <div className="pt-4 border-t">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground hover:underline">
              이용약관
            </Link>
            <span className="text-muted-foreground/50">|</span>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

