"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const code = searchParams.get("code") || "UNKNOWN";
  const message = searchParams.get("message") || "결제가 완료되지 않았습니다.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 max-w-md mx-auto">
      <XCircle className="h-16 w-16 text-destructive" />
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">결제 실패</h1>
        <p className="text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">오류 코드: {code}</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => router.push("/pricing")}>
          다시 시도
        </Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          홈으로
        </Button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
