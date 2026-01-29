"use client";

import { Badge } from "@/components/ui/badge";
import {
  FeatureRequestStatus,
  FEATURE_REQUEST_STATUS_CONFIG,
} from "@/types/feature-request";
import { cn } from "@/lib/utils";

interface FeatureRequestStatusBadgeProps {
  status: FeatureRequestStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * 기능 요청 상태 배지
 */
export function FeatureRequestStatusBadge({
  status,
  size = "md",
  className,
}: FeatureRequestStatusBadgeProps) {
  const config = FEATURE_REQUEST_STATUS_CONFIG[status];

  if (!config) {
    return null;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        config.bgColor,
        config.textColor,
        "border-transparent font-medium",
        size === "sm" && "text-[10px] px-1.5 py-0",
        size === "md" && "text-xs px-2 py-0.5",
        size === "lg" && "text-sm px-2.5 py-1",
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
