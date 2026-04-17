"use client";

import Link from "next/link";
import { KeyRound, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface AccountSectionProps {
  email: string | null;
  provider: string;
}

const PROVIDER_LABEL: Record<string, string> = {
  email: "이메일",
  kakao: "카카오 계정",
  google: "Google 계정",
};

/**
 * 설정 / 계정 섹션.
 * - 현재 이메일·로그인 제공자 표시
 * - 비밀번호 재설정 / 계정 삭제는 기존 페이지로 연결
 */
export function AccountSection({ email, provider }: AccountSectionProps) {
  const providerLabel = PROVIDER_LABEL[provider] ?? provider;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
        <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">이메일</p>
          <p className="truncate text-sm font-medium">{email ?? "—"}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">로그인 방법</p>
          <p className="text-sm font-medium">{providerLabel}</p>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        {provider === "email" && (
          <Button asChild variant="outline" className="w-full justify-start gap-2">
            <Link href="/reset-password">
              <KeyRound className="h-4 w-4" />
              비밀번호 재설정
            </Link>
          </Button>
        )}
        <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
          <Link href="/profile">프로필 정보 수정하기</Link>
        </Button>
      </div>
    </div>
  );
}
