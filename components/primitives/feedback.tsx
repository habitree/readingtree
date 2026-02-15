import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Spinner - 표준화된 로딩 스피너
// ============================================================================

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  /** 스피너 크기 */
  size?: keyof typeof sizeMap;
}

function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted-foreground", sizeMap[size], className)}
      {...props}
    />
  );
}

// ============================================================================
// FullPageSpinner - 전체 페이지 로딩 (Suspense fallback용)
// ============================================================================

export interface FullPageSpinnerProps {
  /** 로딩 메시지 (선택) */
  message?: string;
  className?: string;
}

function FullPageSpinner({ message, className }: FullPageSpinnerProps) {
  return (
    <div
      className={cn(
        "flex min-h-[50vh] flex-col items-center justify-center gap-3",
        className
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export { Spinner, FullPageSpinner };
