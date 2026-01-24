"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressIndicator } from "./progress-indicator";
import { ConsentStep, GoalStep, TutorialStep } from "./steps";
import { agreeToTerms, setReadingGoal } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingData {
  termsAgreed: boolean;
  privacyAgreed: boolean;
  goal: number;
}

interface OnboardingWizardProps {
  /**
   * 시작 스텝 (0: 약관 동의, 1: 목표 설정, 2: 튜토리얼)
   * 이미 완료된 단계가 있으면 해당 단계부터 시작
   */
  initialStep?: number;
}

const STEPS = [
  { id: "consent", title: "약관 동의" },
  { id: "goal", title: "목표 설정" },
  { id: "tutorial", title: "사용법" },
];

/**
 * 프로그레시브 온보딩 위저드
 * 3단계 (약관 동의 → 목표 설정 → 튜토리얼)를 통합한 온보딩 플로우
 */
export function OnboardingWizard({ initialStep = 0 }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({});

  // 약관 동의 처리
  const handleConsentNext = useCallback(
    async (consentData: { termsAgreed: boolean; privacyAgreed: boolean }) => {
      setIsLoading(true);
      try {
        await agreeToTerms(consentData.termsAgreed, consentData.privacyAgreed);
        setData((prev) => ({ ...prev, ...consentData }));
        setCurrentStep(1);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "약관 동의에 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 목표 설정 처리
  const handleGoalNext = useCallback(
    async (goalData: { goal: number }) => {
      setIsLoading(true);
      try {
        await setReadingGoal(goalData.goal);
        setData((prev) => ({ ...prev, ...goalData }));
        setCurrentStep(2);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "목표 설정에 실패했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 온보딩 완료 처리
  const handleComplete = useCallback(() => {
    // 로컬 스토리지에 튜토리얼 완료 저장
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_tutorial_completed", "true");
    }
    toast.success("환영합니다! ReadTree와 함께 독서를 시작해보세요.");
    router.push("/");
  }, [router]);

  // 이전 스텝으로 이동 (초기 스텝 이전으로는 이동 불가)
  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(initialStep, prev - 1));
  }, [initialStep]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-lg space-y-6">
        {/* 진행률 표시 */}
        <ProgressIndicator steps={STEPS} currentStep={currentStep} />

        {/* 스텝 컨텐츠 */}
        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div
              className={cn(
                "transition-opacity duration-300",
                isLoading ? "opacity-70 pointer-events-none" : "opacity-100"
              )}
            >
              {currentStep === 0 && (
                <ConsentStep onNext={handleConsentNext} isLoading={isLoading} />
              )}
              {currentStep === 1 && (
                <GoalStep
                  onNext={handleGoalNext}
                  onBack={handleBack}
                  isLoading={isLoading}
                />
              )}
              {currentStep === 2 && (
                <TutorialStep
                  onComplete={handleComplete}
                  onBack={handleBack}
                  isLoading={isLoading}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* 브랜딩 */}
        <p className="text-center text-xs text-muted-foreground">
          © 2026 ReadTree. 독서의 새로운 시작.
        </p>
      </div>
    </div>
  );
}
