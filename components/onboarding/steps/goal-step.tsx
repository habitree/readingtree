"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface GoalStepProps {
  onNext: (data: { goal: number }) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const PRESET_GOALS = [6, 12, 24, 52];

/**
 * 독서 목표 설정 스텝
 * 연간 독서 목표를 설정하는 단계
 */
export function GoalStep({ onNext, onBack, isLoading }: GoalStepProps) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState(12);

  const handleIncrement = () => {
    setGoal((prev) => Math.min(prev + 1, 100));
  };

  const handleDecrement = () => {
    setGoal((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    onNext({ goal });
  };

  // 목표에 따른 동기부여 메시지
  const getMotivationMessage = () => {
    if (goal <= 6) return t("onboarding.goalHalfMonthly");
    if (goal <= 12) return t("onboarding.goalMonthly");
    if (goal <= 24) return t("onboarding.goalBiMonthly");
    if (goal <= 52) return t("onboarding.goalWeekly");
    return t("onboarding.goalBiWeekly");
  };

  return (
    <div className="space-y-6">
      {/* 아이콘 및 설명 */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t("onboarding.goalStep")}</h2>
        </div>
      </div>

      {/* 목표 설정 영역 */}
      <div className="space-y-6">
        {/* 숫자 조절 */}
        <div className="flex items-center justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleDecrement}
            disabled={goal <= 1 || isLoading}
          >
            <Minus className="h-5 w-5" />
          </Button>

          <div className="text-center">
            <div className="text-6xl font-bold text-primary">{goal}</div>
            <div className="text-sm text-muted-foreground mt-1">{t("onboarding.booksPerYear")}</div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleIncrement}
            disabled={goal >= 100 || isLoading}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* 프리셋 버튼 */}
        <div className="flex justify-center gap-2">
          {PRESET_GOALS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={goal === preset ? "default" : "outline"}
              size="sm"
              onClick={() => setGoal(preset)}
              disabled={isLoading}
              className={cn(
                "min-w-[60px]",
                goal === preset && "ring-2 ring-primary/20"
              )}
            >
              {preset}{t("onboarding.booksUnit")}
            </Button>
          ))}
        </div>

        {/* 동기부여 메시지 */}
        <div className="text-center p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {getMotivationMessage()}
          </p>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1"
        >
          {t("common.prev")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? t("onboarding.saving") : t("common.next")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t("onboarding.goalChangeHint")}
      </p>
    </div>
  );
}
