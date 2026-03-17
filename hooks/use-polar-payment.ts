"use client";

import { useState, useCallback } from "react";

interface UsePolarPaymentReturn {
  requestPayment: (packageId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function usePolarPayment(): UsePolarPaymentReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPayment = useCallback(async (packageId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout/polar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "결제 페이지 생성에 실패했습니다.");
        return;
      }

      // Polar 체크아웃 페이지로 리다이렉트
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "결제 요청에 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { requestPayment, isLoading, error };
}
