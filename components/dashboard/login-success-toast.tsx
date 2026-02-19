"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

/**
 * 로그인 성공 메시지 표시 컴포넌트
 * 클라이언트 컴포넌트로 분리하여 Server Component에서 사용 가능
 */
export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      toast.success(t("auth.loginSuccess"), {
        description: t("auth.loginSuccessDesc"),
        duration: 3000,
      });
      // URL에서 파라미터 제거
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, t]);

  return null;
}
