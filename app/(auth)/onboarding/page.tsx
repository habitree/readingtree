import { redirect } from "next/navigation";
import { checkOnboardingComplete, checkConsentComplete } from "@/app/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding";

/**
 * 온보딩 메인 페이지
 * 프로그레시브 온보딩 위저드를 렌더링
 *
 * 온보딩 완료 여부에 따라:
 * - 완료: 메인 페이지로 리다이렉트
 * - 미완료: 위저드 표시 (이미 완료된 단계는 건너뜀)
 */
export default async function OnboardingPage() {
  // 온보딩 및 약관 동의 상태 확인
  const [onboardingStatus, consentStatus] = await Promise.all([
    checkOnboardingComplete(),
    checkConsentComplete(),
  ]);

  if (onboardingStatus.isComplete) {
    // 온보딩 완료 시 메인으로 리다이렉트
    redirect("/");
  }

  // 시작 스텝 결정
  // - 약관 동의 완료: 목표 설정부터 (step 1)
  // - 목표 설정 완료: 튜토리얼부터 (step 2)
  // - 모두 미완료: 처음부터 (step 0)
  let initialStep = 0;

  if (consentStatus.isComplete) {
    initialStep = 1; // 약관 동의 완료 → 목표 설정부터

    if (!onboardingStatus.needsGoal) {
      initialStep = 2; // 목표 설정도 완료 → 튜토리얼부터
    }
  }

  // 프로그레시브 온보딩 위저드 렌더링
  return <OnboardingWizard initialStep={initialStep} />;
}

