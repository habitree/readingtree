"use client";

import { useState, useCallback } from "react";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { createPaymentOrder } from "@/app/actions/payment";
import { IS_TOSS_ENABLED } from "@/lib/payment/config";

interface UseTossPaymentReturn {
  requestPayment: (packageId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * @deprecated 토스페이먼츠 비활성화 상태. IS_TOSS_ENABLED = true로 전환 시 재활성화.
 * Polar 결제를 대신 사용하세요.
 */
export function useTossPayment(): UseTossPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPayment = useCallback(async (packageId: string) => {
    if (!IS_TOSS_ENABLED) {
      setError("토스페이먼츠 결제가 비활성화되었습니다. Polar 결제를 이용해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 서버에서 주문 생성
      const orderResult = await createPaymentOrder(packageId);

      if (!orderResult.success || !orderResult.orderId) {
        setError(orderResult.error || "주문 생성에 실패했습니다.");
        return;
      }

      // 2. 토스 SDK 초기화
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        setError("결제 설정이 완료되지 않았습니다.");
        return;
      }

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      // 3. 결제창 열기 (전체 결제 수단)
      const origin = window.location.origin;

      await payment.requestPayment({
        method: "CARD",
        amount: {
          currency: "KRW",
          value: orderResult.amount!,
        },
        orderId: orderResult.orderId,
        orderName: orderResult.orderName!,
        customerName: orderResult.customerName,
        successUrl: `${origin}/payment/success`,
        failUrl: `${origin}/payment/fail`,
      });
    } catch (err: unknown) {
      // 사용자가 결제창을 닫은 경우 에러를 무시
      if (err instanceof Error && err.message?.includes("USER_CANCEL")) {
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : "결제 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { requestPayment, isLoading, error };
}
