import * as React from "react";
import { cn } from "@/lib/utils";
import { spacing, grids } from "@/lib/design-tokens";

// ============================================================================
// Stack - 세로 정렬 (Flexbox column + spacing 토큰)
// ============================================================================

type SpacingKey = keyof typeof spacing;

export interface StackProps {
  /** spacing 토큰 키 또는 Tailwind 클래스 */
  gap?: SpacingKey | (string & {});
  /** HTML 태그 (기본: div) */
  as?: "div" | "section" | "article" | "main" | "form" | "fieldset" | "ul" | "ol";
  className?: string;
  children?: React.ReactNode;
  id?: string;
  role?: React.AriaRole;
  "aria-label"?: string;
}

function Stack({ gap, as: Tag = "div", className, children, ...props }: StackProps) {
  const gapClass = gap
    ? gap in spacing
      ? spacing[gap as SpacingKey]
      : gap
    : undefined;

  return (
    <Tag className={cn("flex flex-col", gapClass, className)} {...props}>
      {children}
    </Tag>
  );
}

// ============================================================================
// Inline - 가로 정렬 (Flexbox row)
// ============================================================================

export interface InlineProps {
  /** spacing 토큰 키 또는 Tailwind 클래스 */
  gap?: SpacingKey | (string & {});
  /** 세로 정렬 */
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  /** 가로 정렬 */
  justify?: "start" | "center" | "end" | "between" | "around";
  /** 줄바꿈 허용 */
  wrap?: boolean;
  /** HTML 태그 (기본: div) */
  as?: "div" | "nav" | "ul" | "ol";
  className?: string;
  children?: React.ReactNode;
  id?: string;
  role?: React.AriaRole;
  "aria-label"?: string;
}

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
} as const;

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

function Inline({
  gap,
  align = "center",
  justify,
  wrap,
  as: Tag = "div",
  className,
  children,
  ...props
}: InlineProps) {
  const gapClass = gap
    ? gap in spacing
      ? spacing[gap as SpacingKey]
      : gap
    : undefined;

  return (
    <Tag
      className={cn(
        "flex",
        alignMap[align],
        justify && justifyMap[justify],
        wrap && "flex-wrap",
        gapClass,
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ============================================================================
// Grid - 그리드 레이아웃 (grids 토큰)
// ============================================================================

type GridVariant = keyof typeof grids;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** grids 토큰 키 */
  variant?: GridVariant;
}

function Grid({ variant, className, children, ...props }: GridProps) {
  const gridClass = variant ? grids[variant] : undefined;

  return (
    <div className={cn(gridClass, className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// Container - 페이지 컨테이너
// ============================================================================

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 최대 너비 (기본: max-w-5xl) */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "5xl" | "full";
  /** HTML 태그 (기본: div) */
  as?: "div" | "section" | "main" | "article";
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "5xl": "max-w-5xl",
  full: "max-w-full",
} as const;

function Container({
  maxWidth = "5xl",
  as: Tag = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "container mx-auto px-2 sm:px-4",
        maxWidthMap[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export { Stack, Inline, Grid, Container };
