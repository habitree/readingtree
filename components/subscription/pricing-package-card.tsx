import { Coins, Sparkles } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PointPackageInfo } from "@/lib/subscription/pricing-data";
import { formatPrice } from "@/lib/subscription/pricing-data";

interface PricingPackageCardProps {
  pkg: PointPackageInfo;
}

export function PricingPackageCard({ pkg }: PricingPackageCardProps) {
  const totalPoints = pkg.points + pkg.bonusPoints;
  const firstPurchaseTotal = totalPoints + pkg.firstPurchaseBonusPoints;

  return (
    <Card
      variant={pkg.highlighted ? "highlight" : "default"}
      className="relative flex flex-col"
    >
      {/* 첫 충전 2배 리본 */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {pkg.highlighted && (
          <Badge>인기</Badge>
        )}
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
          <Sparkles className="h-3 w-3 mr-1" />
          첫 충전 2배
        </Badge>
      </div>

      <CardHeader className="text-center pt-8">
        <CardTitle className="text-lg">{pkg.displayName}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">
            {formatPrice(pkg.price)}
          </span>
        </div>
        <CardDescription>
          {pkg.bonusPoints > 0
            ? `${pkg.points.toLocaleString()}P + 보너스 ${pkg.bonusPoints.toLocaleString()}P`
            : `${pkg.points.toLocaleString()}P`}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
          <Coins className="h-6 w-6" />
          <span>{totalPoints.toLocaleString()}P</span>
        </div>
        {pkg.bonusPoints > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            보너스 {pkg.bonusPoints.toLocaleString()}P 포함
          </p>
        )}

        {/* 첫 충전 시 총 포인트 강조 */}
        <div className="rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-3 text-center">
          <p className="text-xs text-amber-700 dark:text-amber-400">첫 충전 시</p>
          <p className="text-lg font-bold text-amber-800 dark:text-amber-300">
            {firstPurchaseTotal.toLocaleString()}P
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant={pkg.highlighted ? "default" : "outline"}
          className="w-full"
          disabled
        >
          준비 중
        </Button>
      </CardFooter>
    </Card>
  );
}
