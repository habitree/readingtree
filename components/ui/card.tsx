import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow",
  {
    variants: {
      variant: {
        default: "",
        // 위험/삭제 영역 (계정 삭제, 모임 삭제 등)
        destructive: "border-destructive/50",
        // 경고/주의 영역
        warning: "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20",
        // 강조/하이라이트 영역
        highlight: "border-primary/50 bg-primary/5",
        // 성공/완료 영역
        success: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20",
        // 최소 스타일 (보더 없음)
        ghost: "border-transparent shadow-none hover:shadow-none bg-transparent",
        // 인터랙티브 카드 (클릭 가능)
        interactive: "cursor-pointer hover:shadow-lg active:shadow-md active:scale-[0.99] transition-all",
        // 글래스모피즘 (반투명 배경)
        glass: "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/50 dark:border-slate-700/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
