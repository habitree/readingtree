"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle, Loader2, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConfirmPaymentResult } from "@/types/payment";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [result, setResult] = useState<ConfirmPaymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const confirmPayment = useCallback(async () => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    try {
      const response = await fetch("/api/payment/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error || "결제 승인에 실패했습니다.");
        return;
      }

      setResult(data);
      setStatus("success");

      // 축하 이펙트
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      setStatus("error");
      setErrorMessage("결제 확인 중 오류가 발생했습니다.");
    }
  }, [searchParams]);

  useEffect(() => {
    confirmPayment();
  }, [confirmPayment]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 max-w-md mx-auto">
        <XCircle className="h-16 w-16 text-destructive" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">결제 확인 실패</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/pricing")}>
            다시 시도
          </Button>
          <Button variant="outline" onClick={() => router.push("/support")}>
            고객 문의
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 max-w-md mx-auto">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">충전 완료!</h1>
        <p className="text-muted-foreground">포인트가 성공적으로 충전되었습니다.</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-lg">충전 내역</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">기본 포인트</span>
            <span className="font-medium">
              +{result?.basePoints?.toLocaleString()}P
            </span>
          </div>
          {(result?.bonusPoints ?? 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">보너스 포인트</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                +{result?.bonusPoints?.toLocaleString()}P
              </span>
            </div>
          )}
          {(result?.firstPurchaseBonus ?? 0) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">첫 충전 보너스</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                +{result?.firstPurchaseBonus?.toLocaleString()}P
              </span>
            </div>
          )}
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-muted-foreground">총 충전</span>
            <span className="text-lg font-bold text-primary">
              +{result?.pointsCharged?.toLocaleString()}P
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">현재 잔액</span>
            <div className="flex items-center gap-1.5 text-lg font-bold">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span>{result?.newBalance?.toLocaleString()}P</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => router.push("/profile")} className="w-full">
        포인트 확인하기
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">로딩 중...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
