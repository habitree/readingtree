import { Coins } from "lucide-react";
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

  return (
    <Card
      variant={pkg.highlighted ? "highlight" : "default"}
      className="relative flex flex-col"
    >
      {pkg.highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          인기
        </Badge>
      )}

      <CardHeader className="text-center">
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

      <CardContent className="flex-1">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
          <Coins className="h-6 w-6" />
          <span>{totalPoints.toLocaleString()}P</span>
        </div>
        {pkg.bonusPoints > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-1">
            보너스 {pkg.bonusPoints.toLocaleString()}P 포함
          </p>
        )}
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
