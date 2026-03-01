"use client";

import { useRouter } from "next/navigation";
import { Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { TIERS, formatPrice } from "@/lib/subscription/pricing-data";

/**
 * 구독 업그레이드 유도 모달
 * 모바일: 바텀시트 / 데스크톱: Dialog
 * 한도 도달 시 전역 zustand store에서 트리거
 */
export function UpgradeModal() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { open, feature, message, closeUpgradeModal } = useUpgradeModal();

  const handleViewPlans = () => {
    closeUpgradeModal();
    router.push("/pricing");
  };

  const content = (
    <div className="space-y-5">
      {/* 한도 도달 메시지 */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
      </div>

      {/* 티어 비교 간략 카드 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={
              tier.highlighted
                ? "rounded-lg border-2 border-primary bg-primary/5 p-3 space-y-1 relative"
                : "rounded-lg border p-3 space-y-1"
            }
          >
            {tier.highlighted && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-2 py-0.5 rounded-full font-medium">
                추천
              </div>
            )}
            <p
              className={`text-xs font-medium ${
                tier.highlighted ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tier.displayName}
            </p>
            <p className="text-sm font-semibold">
              {formatPrice(tier.priceMonthly)}
              {tier.priceMonthly > 0 && "/월"}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {tier.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button onClick={handleViewPlans} className="w-full h-11 gap-2">
          <Crown className="h-4 w-4" />
          구독 플랜 보기
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={closeUpgradeModal}
          className="w-full h-10 text-muted-foreground"
        >
          닫기
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && closeUpgradeModal()}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-6 pb-8 pt-4"
          swipeToClose
          hideCloseButton
        >
          <div className="mx-auto w-12 h-1.5 rounded-full bg-muted mb-6" />
          <SheetHeader className="mb-4">
            <SheetTitle className="text-center text-lg flex items-center justify-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              기능 한도 도달
            </SheetTitle>
            <SheetDescription className="text-center">
              더 많은 기능을 이용하려면 구독을 업그레이드하세요
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeUpgradeModal()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            기능 한도 도달
          </DialogTitle>
          <DialogDescription>
            더 많은 기능을 이용하려면 구독을 업그레이드하세요
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
