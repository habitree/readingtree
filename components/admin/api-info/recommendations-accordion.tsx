"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CollapsibleSection } from "@/components/dashboard/sections/collapsible-section";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Recommendation {
  type: string;
  message: string;
  action: string;
  priority: string;
  category: string;
}

interface RecommendationsAccordionProps {
  recommendations: Recommendation[];
}

const CATEGORY_ORDER = ["인증", "검색", "OCR", "AI", "페이지수"] as const;

const ICON_MAP: Record<string, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const ICON_COLOR: Record<string, string> = {
  success: "text-green-600",
  warning: "text-yellow-600",
  error: "text-red-600",
  info: "text-blue-600",
};

export function RecommendationsAccordion({
  recommendations,
}: RecommendationsAccordionProps) {
  const byCategory = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = recommendations.filter((r) => r.category === cat);
      return acc;
    },
    {} as Record<string, Recommendation[]>
  );

  const hasAny = Object.values(byCategory).some((arr) => arr.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        권장 사항
      </h3>

      {CATEGORY_ORDER.map((category) => {
        const recs = byCategory[category];
        if (!recs || recs.length === 0) return null;

        const hasErrors = recs.some((r) => r.type === "error");

        return (
          <CollapsibleSection
            key={category}
            title={`${category} (${recs.length})`}
            storageKey={`api-rec-${category}`}
            defaultOpen={hasErrors}
          >
            <div className="space-y-2">
              {recs.map((rec, index) => {
                const Icon = ICON_MAP[rec.type] || Info;
                const iconColor = ICON_COLOR[rec.type] || "text-blue-600";

                return (
                  <Alert
                    key={index}
                    variant={
                      rec.type === "error"
                        ? "destructive"
                        : "default"
                    }
                    className={cn(
                      "py-3",
                      rec.type === "success" &&
                        "border-green-500/30 bg-green-500/5",
                      rec.type === "warning" &&
                        "border-yellow-500/30 bg-yellow-500/5"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", iconColor)} />
                    <AlertTitle className="flex items-center gap-2 text-sm">
                      {rec.message}
                      <Badge variant="outline" className="text-[10px]">
                        {rec.priority}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {rec.action}
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );
}
