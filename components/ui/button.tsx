import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // 기본 스타일: 8dp 그리드 시스템, 최소 터치 영역 44x44px, 명확한 시각적 피드백
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary: 브랜드 아이덴티티 색상, 명확한 CTA
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        // Destructive: 위험한 작업에 사용
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        // Outline: 보조 액션, 덜 강조된 버튼
        outline:
          "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/50",
        // Secondary: 보조 색상
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",
        // Ghost: 텍스트 링크 스타일
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Link: 텍스트 링크
        link: "text-primary underline-offset-4 hover:underline",
        // Kakao: 카카오 소셜 로그인
        kakao:
          "bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 shadow-sm hover:shadow-md font-semibold",
        // Google: 구글 소셜 로그인
        google:
          "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md font-medium dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700",
        // Success: 성공/완료 상태
        success:
          "bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow-md",
        // Gradient: 그라데이션 효과 (CTA 강조)
        gradient:
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md",
      },
      size: {
        // 8dp 그리드 시스템 기준: 32px (h-8), 40px (h-10), 48px (h-12)
        default: "h-11 min-h-[44px] px-6 py-2.5", // 최소 터치 영역 44px
        sm: "h-9 min-h-[36px] rounded-md px-4 py-2",
        lg: "h-12 min-h-[48px] rounded-md px-8 py-3",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]", // 최소 터치 영역 44x44px
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
