import * as React from "react";
import { cn } from "@/lib/utils";
import { typography as tokens } from "@/lib/design-tokens";

// ============================================================================
// Heading - 시맨틱 HTML 보장 + 디자인 토큰 자동 적용
// ============================================================================

type HeadingLevel = 1 | 2 | 3 | 4;

const headingTokenMap: Record<HeadingLevel, string> = {
  1: tokens.pageTitle,
  2: tokens.sectionTitle,
  3: tokens.cardTitle,
  4: tokens.label,
};

type HeadingTag = "h1" | "h2" | "h3" | "h4";

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** 제목 레벨 (1~4) - 시맨틱 HTML 태그와 토큰이 자동 적용됩니다 */
  level: HeadingLevel;
  /** 시맨틱 태그를 유지하면서 시각적 스타일만 변경할 때 사용 */
  visualLevel?: HeadingLevel;
}

function Heading({
  level,
  visualLevel,
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as HeadingTag;
  const tokenClass = headingTokenMap[visualLevel ?? level];

  return (
    <Tag className={cn(tokenClass, className)} {...props}>
      {children}
    </Tag>
  );
}

// ============================================================================
// Text - 본문 텍스트 변형
// ============================================================================

type TextVariant =
  | "body"
  | "small"
  | "tiny"
  | "helper"
  | "error"
  | "label"
  | "description";

const textVariantMap: Record<TextVariant, string> = {
  body: "text-sm sm:text-base",
  small: tokens.small,
  tiny: tokens.tiny,
  helper: tokens.helper,
  error: tokens.errorText,
  label: tokens.label,
  description: tokens.pageDescription,
};

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  /** 텍스트 변형 */
  variant?: TextVariant;
  /** HTML 태그 (기본: p) */
  as?: "p" | "span" | "div" | "label";
  /** 줄 수 제한 (line-clamp) */
  lineClamp?: 1 | 2 | 3;
}

function Text({
  variant = "body",
  as: Tag = "p",
  lineClamp,
  className,
  children,
  ...props
}: TextProps) {
  const lineClampClass = lineClamp ? `line-clamp-${lineClamp}` : undefined;

  return (
    <Tag
      className={cn(textVariantMap[variant], lineClampClass, className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ============================================================================
// TextLink - 링크 스타일 텍스트
// ============================================================================

export interface TextLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** 외부 링크 여부 (true면 새 탭에서 열림) */
  external?: boolean;
}

function TextLink({
  external,
  className,
  children,
  ...props
}: TextLinkProps) {
  return (
    <a
      className={cn(tokens.link, className)}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      {...props}
    >
      {children}
    </a>
  );
}

export { Heading, Text, TextLink };
