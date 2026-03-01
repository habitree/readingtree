import { Check } from "lucide-react";
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
import type { TierInfo, FeatureRow } from "@/lib/subscription/pricing-data";
import { getDisplayLimit, formatPrice } from "@/lib/subscription/pricing-data";

interface PricingTierCardProps {
  tier: TierInfo;
  features: FeatureRow[];
}

export function PricingTierCard({ tier, features }: PricingTierCardProps) {
  const isFree = tier.name === "free";

  return (
    <Card
      variant={tier.highlighted ? "highlight" : "default"}
      className="relative flex flex-col"
    >
      {tier.highlighted && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          추천
        </Badge>
      )}

      <CardHeader className="text-center">
        <CardTitle className="text-lg">{tier.displayName}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">
            {formatPrice(tier.priceMonthly)}
          </span>
          {!isFree && (
            <span className="text-sm text-muted-foreground">/월</span>
          )}
        </div>
        <CardDescription>{tier.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-2.5">
          {features.map((feat) => {
            const display = getDisplayLimit(feat.key, tier.name, feat.unit);
            const unavailable = display === "—";

            return (
              <li
                key={feat.key}
                className={`flex items-center gap-2 text-sm ${
                  unavailable ? "text-muted-foreground" : ""
                }`}
              >
                <Check
                  className={`h-4 w-4 flex-shrink-0 ${
                    unavailable
                      ? "text-muted-foreground/40"
                      : "text-primary"
                  }`}
                />
                <span>
                  {feat.label}{" "}
                  <span className="font-medium">{display}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          variant={tier.highlighted ? "default" : "outline"}
          className="w-full"
          disabled
        >
          {tier.ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
