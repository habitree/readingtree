"use client";

import * as React from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ============================================================================
// TextField - 텍스트 입력 필드 (FormField 보일러플레이트 제거)
// ============================================================================

export interface TextFieldProps<T extends FieldValues = FieldValues> {
  /** react-hook-form 필드 이름 */
  name: Path<T>;
  /** 라벨 텍스트 */
  label?: string;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 입력 타입 */
  type?: React.HTMLInputTypeAttribute;
  /** 필수 필드 표시 */
  required?: boolean;
  /** 도움말 텍스트 */
  description?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** Input에 전달할 추가 props */
  inputProps?: React.ComponentProps<typeof Input>;
}

function TextField<T extends FieldValues = FieldValues>({
  name,
  label,
  placeholder,
  type = "text",
  required,
  description,
  disabled,
  className,
  inputProps,
}: TextFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
              value={field.value ?? ""}
              {...inputProps}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================================================
// TextAreaField - 텍스트 영역 필드
// ============================================================================

export interface TextAreaFieldProps<T extends FieldValues = FieldValues> {
  /** react-hook-form 필드 이름 */
  name: Path<T>;
  /** 라벨 텍스트 */
  label?: string;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 행 수 */
  rows?: number;
  /** 최대 글자 수 */
  maxLength?: number;
  /** 필수 필드 표시 */
  required?: boolean;
  /** 도움말 텍스트 */
  description?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
  /** Textarea에 전달할 추가 props */
  textareaProps?: React.ComponentProps<typeof Textarea>;
}

function TextAreaField<T extends FieldValues = FieldValues>({
  name,
  label,
  placeholder,
  rows = 3,
  maxLength,
  required,
  description,
  disabled,
  className,
  textareaProps,
}: TextAreaFieldProps<T>) {
  const { control, watch } = useFormContext<T>();
  const value = maxLength ? watch(name) : undefined;
  const charCount = typeof value === "string" ? (value as string).length : 0;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
          )}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              disabled={disabled}
              {...field}
              value={field.value ?? ""}
              {...textareaProps}
            />
          </FormControl>
          <div className="flex items-center justify-between">
            {description ? (
              <FormDescription>{description}</FormDescription>
            ) : (
              <div />
            )}
            {maxLength && (
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  charCount > maxLength * 0.9 && "text-amber-600 dark:text-amber-400",
                  charCount >= maxLength && "text-destructive"
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ============================================================================
// SwitchField - 스위치 토글 필드
// ============================================================================

export interface SwitchFieldProps<T extends FieldValues = FieldValues> {
  /** react-hook-form 필드 이름 */
  name: Path<T>;
  /** 라벨 텍스트 */
  label: string;
  /** 도움말 텍스트 */
  description?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

function SwitchField<T extends FieldValues = FieldValues>({
  name,
  label,
  description,
  disabled,
  className,
}: SwitchFieldProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex items-center justify-between rounded-lg border p-3 sm:p-4",
            className
          )}
        >
          <div className="space-y-0.5">
            <FormLabel className="text-base cursor-pointer">{label}</FormLabel>
            {description && (
              <FormDescription>{description}</FormDescription>
            )}
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export { TextField, TextAreaField, SwitchField };
