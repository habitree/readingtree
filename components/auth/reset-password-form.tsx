"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, MailCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/utils/url";
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

const schema = z.object({
  email: z.string().email("올바른 이메일 형식이 아니에요."),
});

type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const appUrl = getAppUrl();
      const redirectTo = `${appUrl}/callback?type=recovery&next=/update-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo,
      });

      if (error) {
        notify.error("재설정 이메일을 보내지 못했어요", {
          description: error.message,
        });
        return;
      }

      setSentTo(data.email);
      notify.success("재설정 링크를 보냈어요", {
        description: "이메일 수신함을 확인해주세요.",
      });
    } catch (error) {
      notify.error(error instanceof Error ? error : "요청 처리에 실패했어요");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sentTo) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-semibold">
            이메일을 확인해주세요
          </CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{sentTo}</span>
            으로 재설정 링크를 보냈어요. 링크는 1시간 동안 유효해요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setSentTo(null)}
          >
            다른 이메일로 다시 보내기
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            이메일이 도착하지 않았다면 스팸함도 확인해주세요.
          </p>
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
        <CardTitle className="text-2xl font-bold text-center">
          비밀번호 재설정
        </CardTitle>
        <CardDescription className="text-center">
          가입하신 이메일 주소를 입력하시면 재설정 링크를 보내드려요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="example@email.com"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                전송 중...
              </>
            ) : (
              "재설정 링크 받기"
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
