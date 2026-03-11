"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressIndicator } from "./progress-indicator";
import { ConsentStep, GoalStep, TutorialStep } from "./steps";
import { agreeToTerms, setReadingGoal } from "@/app/actions/onboarding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/auth-context";

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

/**
 * 프로그레시브 온보딩 위저드
 * 3단계 (약관 동의 → 목표 설정 → 튜토리얼)를 통합한 온보딩 플로우
 */
export function OnboardingWizard({ initialStep = 0 }: OnboardingWizardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const STEPS = [
    { id: "consent", title: t("onboarding.consentStep") },
    { id: "goal", title: t("onboarding.goalStep") },
    { id: "tutorial", title: t("onboarding.tutorialStep") },
  ];
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({});

  // 약관 동의 처리 → 바로 대시보드로 이동 (목표/튜토리얼 스킵)
  const handleConsentNext = useCallback(
    async (consentData: { termsAgreed: boolean; privacyAgreed: boolean }) => {
      setIsLoading(true);
      try {
        await agreeToTerms(consentData.termsAgreed, consentData.privacyAgreed);
        setData((prev) => ({ ...prev, ...consentData }));
        // 약관 동의 후 프로필 갱신 → 대시보드로 이동
        await refreshProfile();
        if (typeof window !== "undefined") {
          localStorage.setItem("onboarding_tutorial_completed", "true");
        }
        toast.success(t("onboarding.welcomeMessage"));
        router.refresh();
        router.push("/");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("onboarding.consentFailed")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [router, t, refreshProfile]
  );

  // 목표 설정 처리 (프로필 페이지에서 접근 시 사용)
  const handleGoalNext = useCallback(
    async (goalData: { goal: number }) => {
      setIsLoading(true);
      try {
        await setReadingGoal(goalData.goal);
        await refreshProfile();
        setData((prev) => ({ ...prev, ...goalData }));
        setCurrentStep(2);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("onboarding.goalFailed")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [t, refreshProfile]
  );

  // 온보딩 완료 처리
  const handleComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_tutorial_completed", "true");
    }
    toast.success(t("onboarding.setupComplete"));
    router.push("/");
  }, [router, t]);

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
          {t("onboarding.copyright")}
        </p>
      </div>
    </div>
  );
}
