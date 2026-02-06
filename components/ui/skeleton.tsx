import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shimmer 효과 활성화 (기본값: true) */
  shimmer?: boolean;
}

function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        shimmer && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent dark:before:via-white/10",
        !shimmer && "animate-pulse",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
