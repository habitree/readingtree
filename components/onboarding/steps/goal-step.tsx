"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (goal <= 6) return "한 달에 한 권 정도의 여유로운 독서";
    if (goal <= 12) return "한 달에 한 권, 꾸준한 독서 습관";
    if (goal <= 24) return "한 달에 두 권, 열정적인 독서가";
    if (goal <= 52) return "일주일에 한 권, 다독가의 길";
    return "일주일에 두 권 이상, 독서 마스터!";
  };

  return (
    <div className="space-y-6">
      {/* 아이콘 및 설명 */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">독서 목표 설정</h2>
          <p className="text-sm text-muted-foreground mt-1">
            올해 읽고 싶은 책의 수를 설정해주세요
          </p>
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
            <div className="text-sm text-muted-foreground mt-1">권 / 년</div>
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
              {preset}권
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
          이전
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? "저장 중..." : "다음"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        목표는 나중에 설정에서 변경할 수 있습니다
      </p>
    </div>
  );
}
