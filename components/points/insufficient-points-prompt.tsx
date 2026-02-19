"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

interface InsufficientPointsPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredPoints: number;
  currentBalance: number;
}

export function InsufficientPointsPrompt({
  open,
  onOpenChange,
  requiredPoints,
  currentBalance,
}: InsufficientPointsPromptProps) {
  const { t } = useTranslation();
  const shortfall = requiredPoints - currentBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            {t("points.insufficientPoints" as any)}
          </DialogTitle>
          <DialogDescription>
            {t("points.insufficientPointsDesc" as any)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("points.requiredPoints" as any)}</span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">{requiredPoints}P</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("points.currentBalance" as any)}</span>
              <span className="font-semibold">{currentBalance}P</span>
            </div>
            <div className="border-t border-amber-200 dark:border-amber-800 pt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{t("points.shortfall" as any)}</span>
              <span className="font-bold text-red-500">-{shortfall}P</span>
            </div>
          </div>

          <Button asChild className="w-full" onClick={() => onOpenChange(false)}>
            <Link href="/profile?tab=points">
              {t("points.earnMorePoints" as any)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
