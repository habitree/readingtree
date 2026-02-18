"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * 로그인 성공 메시지 표시 컴포넌트
 * 클라이언트 컴포넌트로 분리하여 Server Component에서 사용 가능
 */
export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("login") === "success") {
      toast.success("로그인했어요.", {
        description: "독서 여정을 시작해보세요.",
        duration: 3000,
      });
      // URL에서 파라미터 제거
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  return null;
}

