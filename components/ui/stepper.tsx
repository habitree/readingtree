"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export interface StepperProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * 스테퍼 컴포넌트
 * 숫자 입력에 드롭다운 대신 +, - 버튼을 사용하여 효율적인 조작을 제공합니다.
 * 디테일 가이드 02: Stepper vs Dropdown 원칙 적용
 */
export const Stepper = React.forwardRef<HTMLInputElement, StepperProps>(
  (
    {
      value,
      onChange,
      min = 1,
      max = 9999,
      step = 1,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [localValue, setLocalValue] = React.useState<number | undefined>(
      value
    );

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleIncrement = () => {
      if (disabled) return;
      const newValue = (localValue ?? min) + step;
      if (newValue <= max) {
        const finalValue = newValue;
        setLocalValue(finalValue);
        onChange?.(finalValue);
      }
    };

    const handleDecrement = () => {
      if (disabled) return;
      const newValue = (localValue ?? min) - step;
      if (newValue >= min) {
        const finalValue = newValue;
        setLocalValue(finalValue);
        onChange?.(finalValue);
      } else if (newValue < min) {
        // 최소값보다 작아지면 undefined로 처리 (빈 값)
        setLocalValue(undefined);
        onChange?.(undefined);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === "" || inputValue === null || inputValue === undefined) {
        setLocalValue(undefined);
        onChange?.(undefined);
        return;
      }

      const num = Number(inputValue);
      if (isNaN(num)) {
        return;
      }

      if (num < min) {
        setLocalValue(undefined);
        onChange?.(undefined);
      } else if (num > max) {
        const finalValue = max;
        setLocalValue(finalValue);
        onChange?.(finalValue);
      } else {
        setLocalValue(num);
        onChange?.(num);
      }
    };

    const handleBlur = () => {
      // blur 시 최소값보다 작으면 undefined로 처리
      if (localValue !== undefined && localValue < min) {
        setLocalValue(undefined);
        onChange?.(undefined);
      }
    };

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || (localValue !== undefined && localValue <= min)}
          className="h-10 w-10 shrink-0"
          aria-label={t("stepper.decrease")}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          ref={ref}
          type="number"
          value={localValue ?? ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="text-center"
          placeholder={t("stepper.optional")}
          {...props}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || (localValue !== undefined && localValue >= max)}
          className="h-10 w-10 shrink-0"
          aria-label={t("stepper.increase")}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }
);

Stepper.displayName = "Stepper";

