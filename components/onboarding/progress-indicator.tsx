"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProgressIndicatorProps {
  steps: { id: string; title: string }[];
  currentStep: number;
  className?: string;
}

/**
 * 온보딩 진행률 표시 컴포넌트
 * 현재 단계와 완료된 단계를 시각적으로 표시
 */
export function ProgressIndicator({
  steps,
  currentStep,
  className,
}: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* 모바일: 심플 도트 */}
      <div className="flex items-center justify-center gap-2 sm:hidden">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              index < currentStep
                ? "bg-primary"
                : index === currentStep
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* 데스크톱: 상세 스텝퍼 */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* 스텝 원형 */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 font-medium text-sm",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              {/* 스텝 타이틀 */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors duration-300",
                  index <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>

            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 lg:w-24 h-0.5 mx-2 transition-colors duration-300",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
