"use client";

import { useRouter } from "next/navigation";
import { Coins, ArrowRight } from "lucide-react";
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

const POINT_COSTS = [
  { label: "AI 채팅", cost: "100P" },
  { label: "OCR 필사", cost: "80P" },
  { label: "AI 리포트", cost: "150P" },
];

/**
 * 기능 한도 도달 모달
 * 모바일: 바텀시트 / 데스크톱: Dialog
 * 한도 도달 시 전역 zustand store에서 트리거
 */
export function UpgradeModal() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { open, message, closeUpgradeModal } = useUpgradeModal();

  const handleViewPricing = () => {
    closeUpgradeModal();
    router.push("/pricing");
  };

  const content = (
    <div className="space-y-5">
      {/* 한도 도달 메시지 */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">{message}</p>
      </div>

      {/* 포인트 비용 안내 */}
      <div className="rounded-lg border p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          포인트로 추가 사용 가능
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {POINT_COSTS.map((item) => (
            <div key={item.label} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold">{item.cost}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button onClick={handleViewPricing} className="w-full h-11 gap-2">
          <Coins className="h-4 w-4" />
          포인트 충전하기
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
              <Coins className="h-5 w-5 text-amber-500" />
              기능 한도 도달
            </SheetTitle>
            <SheetDescription className="text-center">
              포인트를 사용하세요
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
            <Coins className="h-5 w-5 text-amber-500" />
            기능 한도 도달
          </DialogTitle>
          <DialogDescription>
            포인트를 사용하세요
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
