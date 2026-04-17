import { Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type PremiumTier = "free" | "reader_v2" | "master_v2";

export interface PremiumBadgeProps {
  tier: PremiumTier | string | null | undefined;
  size?: "sm" | "md";
  /** "free" 티어일 때 아무 것도 렌더하지 않을지 (기본 true) */
  hideOnFree?: boolean;
  className?: string;
}

/**
 * 구독 티어 배지.
 * 프로필·댓글·모임 멤버 목록 등에서 재사용한다.
 *
 *   <PremiumBadge tier={user.tier} />
 */
export function PremiumBadge({
  tier,
  size = "sm",
  hideOnFree = true,
  className,
}: PremiumBadgeProps) {
  if (tier === "free" || !tier) {
    if (hideOnFree) return null;
    return null;
  }

  const isMaster = tier === "master_v2";
  const label = isMaster ? "Master" : "Reader";
  const Icon = isMaster ? Crown : Sparkles;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tracking-wide",
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2 py-0.5 text-xs",
        isMaster
          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm"
          : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm",
        className,
      )}
      aria-label={`${label} 프리미엄 배지`}
    >
      <Icon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      <span>{label}</span>
    </span>
  );
}
