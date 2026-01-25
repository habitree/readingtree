"use client";

import { useEffect, useState } from "react";
import { useRive, Layout, Fit, useStateMachineInput } from "@rive-app/react-canvas";
import { cn } from "@/lib/utils";
import { ReadingTree } from "./reading-tree";

interface ReadingTreeRiveProps {
  level: number;
  health?: number;
  isWatering?: boolean;
  className?: string;
}

/**
 * Rive 기반 나무 컴포넌트
 *
 * Rive 애니메이션 파일이 있으면 Rive를 사용하고,
 * 없으면 기존 SVG 기반 ReadingTree로 폴백
 *
 * 사용법:
 * 1. Rive 에디터에서 reading-tree.riv 파일 생성
 * 2. 상태 머신 "TreeStateMachine"에 다음 입력 추가:
 *    - level (number): 1-10
 *    - health (number): 0-100
 *    - isWatering (boolean)
 * 3. public/animations/reading-tree.riv에 배치
 */
export function ReadingTreeRive({
  level,
  health = 100,
  isWatering = false,
  className,
}: ReadingTreeRiveProps) {
  const [useRiveAnimation, setUseRiveAnimation] = useState(true);
  const [hasError, setHasError] = useState(false);

  // prefers-reduced-motion 체크
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const { rive, RiveComponent } = useRive({
    src: "/animations/reading-tree.riv",
    stateMachines: "TreeStateMachine",
    layout: new Layout({ fit: Fit.Contain }),
    autoplay: !prefersReducedMotion,
    onLoadError: () => {
      setUseRiveAnimation(false);
      setHasError(true);
    },
  });

  const levelInput = useStateMachineInput(rive, "TreeStateMachine", "level");
  const healthInput = useStateMachineInput(rive, "TreeStateMachine", "health");
  const wateringInput = useStateMachineInput(rive, "TreeStateMachine", "isWatering");

  // 상태 업데이트
  useEffect(() => {
    if (levelInput) levelInput.value = level;
    if (healthInput) healthInput.value = health;
    if (wateringInput) wateringInput.value = isWatering;
  }, [level, health, isWatering, levelInput, healthInput, wateringInput]);

  // Rive 로드 실패 또는 모션 감소 선호 시 SVG 폴백
  if (!useRiveAnimation || hasError || prefersReducedMotion) {
    return (
      <ReadingTree
        level={level}
        health={health}
        isWatering={isWatering}
        className={className}
      />
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <RiveComponent />
    </div>
  );
}

/**
 * ReadingTreeRive의 스태틱 이미지 버전
 * Rive 파일 없이 정적 이미지만 사용할 때
 */
export function ReadingTreeStatic({
  level,
  health = 100,
  className,
}: Omit<ReadingTreeRiveProps, "isWatering">) {
  return (
    <ReadingTree
      level={level}
      health={health}
      isWatering={false}
      className={className}
    />
  );
}
