"use client";

import { useRouter } from "next/navigation";
import { Coins, ArrowRight, Sparkles, Lightbulb, Gift, Trophy } from "lucide-react";
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
import { useUpgradeModal } from "@/hooks/use-upgrade-modal";
import { useEffect, useState } from "react";
import { IS_BETA_MODE } from "@/lib/subscription/beta";
import { getUpgradeCopy } from "@/lib/subscription/upgrade-copy";

/** 포인트로 가능한 사용 횟수 예시 */
const POINT_VALUE_EXAMPLES = [
  { label: "AI 채팅", uses: "12회", points: "480P", icon: "chat" },
  { label: "OCR 필사", uses: "20회", points: "500P", icon: "ocr" },
  { label: "AI 리포트", uses: "5회", points: "500P", icon: "report" },
];

/**
 * Gain-framing 업그레이드 모달
 * 모바일: 바텀시트 / 데스크톱: Dialog
 * 심리학적 Gain-framing으로 전환율 극대화
 */
export function UpgradeModal() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { open, message, featureKey, closeUpgradeModal } = useUpgradeModal();
  const copy = getUpgradeCopy(featureKey);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    setMounted(true);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // 베타 모드에서는 한도 9999이므로 트리거되지 않지만 안전장치
  if (IS_BETA_MODE) return null;

  const handleViewPricing = () => {
    closeUpgradeModal();
    router.push("/pricing");
  };

  const handleGoToMissions = () => {
    closeUpgradeModal();
    router.push("/dashboard");
  };

  const content = (
    <div className="space-y-5">
      {/* 한도 도달 메시지 (간결) */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 space-y-1">
        <p className="text-xs text-blue-700/80 dark:text-blue-300/80">{copy.description}</p>
        {message && (
          <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
        )}
      </div>

      {/* Gain-framing: 포인트로 할 수 있는 것들 */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-medium">포인트로 할 수 있는 것들</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {POINT_VALUE_EXAMPLES.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border bg-card p-3 text-center space-y-1"
            >
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-base font-bold text-primary">{item.uses}</p>
              <p className="text-[10px] text-muted-foreground">{item.points}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 첫 충전 2배 보너스 배너 */}
      <div className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-3">
        <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            첫 충전 시 포인트 2배!
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
            지금 충전하면 2배의 포인트를 드려요
          </p>
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
          variant="outline"
          onClick={handleGoToMissions}
          className="w-full h-10 gap-2"
        >
          <Trophy className="h-4 w-4" />
          미션으로 포인트 얻기
        </Button>
        <button
          onClick={closeUpgradeModal}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;

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
              <Lightbulb className="h-5 w-5 text-amber-500" />
              {copy.headline}
            </SheetTitle>
            <SheetDescription className="text-center sr-only">
              포인트 충전 안내
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeUpgradeModal()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            더 깊은 독서를 이어가세요
          </DialogTitle>
          <DialogDescription className="sr-only">
            포인트 충전 안내
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
