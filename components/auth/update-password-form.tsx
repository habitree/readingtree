"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ShieldCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { notify } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z
  .object({
    password: z.string().min(8, "비밀번호는 8자 이상이어야 해요."),
    confirmPassword: z.string().min(1, "비밀번호를 한 번 더 입력해주세요."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "비밀번호가 일치하지 않아요.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState<"loading" | "ok" | "missing">(
    "loading",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getSession().then((result: { data: { session: unknown } }) => {
      if (cancelled) return;
      setSessionReady(result.data.session ? "ok" : "missing");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        notify.error("비밀번호 변경에 실패했어요", {
          description: error.message,
        });
        return;
      }

      notify.success("비밀번호를 변경했어요", {
        description: "새 비밀번호로 로그인해주세요.",
      });

      await supabase.auth.signOut();
      router.replace("/login");
    } catch (error) {
      notify.error(error instanceof Error ? error : "요청 처리에 실패했어요");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionReady === "loading") {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          세션을 확인하고 있어요...
        </CardContent>
      </Card>
    );
  }

  if (sessionReady === "missing") {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-semibold">
            링크가 만료되었어요
          </CardTitle>
          <CardDescription>
            재설정 링크가 유효하지 않거나 만료됐어요. 새 링크를 요청해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild fullWidth>
            <Link href="/reset-password">새 링크 요청하기</Link>
          </Button>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold text-center">
          새 비밀번호 설정
        </CardTitle>
        <CardDescription className="text-center">
          8자 이상의 안전한 비밀번호를 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">새 비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상"
              disabled={isSubmitting}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="같은 비밀번호를 다시 입력"
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                변경 중...
              </>
            ) : (
              "비밀번호 변경하기"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
