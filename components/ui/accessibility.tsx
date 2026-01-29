"use client";

import { useEffect, useRef, useCallback, useState, createContext, useContext } from "react";
import { cn } from "@/lib/utils";

/**
 * 스크린 리더 전용 텍스트
 * 시각적으로는 숨겨지지만 스크린 리더가 읽을 수 있음
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  /** 포커스 시 표시 여부 */
  focusable?: boolean;
  className?: string;
}

export function ScreenReaderOnly({
  children,
  focusable = false,
  className,
}: ScreenReaderOnlyProps) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "[clip:rect(0,0,0,0)]",
        focusable && "focus:static focus:w-auto focus:h-auto focus:p-2 focus:m-0 focus:overflow-visible focus:clip-auto",
        className
      )}
      tabIndex={focusable ? 0 : undefined}
    >
      {children}
    </span>
  );
}

/**
 * 스킵 네비게이션 링크
 * 키보드 사용자가 반복 네비게이션을 건너뛸 수 있게 함
 */
interface SkipLinkProps {
  /** 이동할 요소의 ID */
  targetId: string;
  /** 표시 텍스트 */
  label?: string;
}

export function SkipLink({ targetId, label = "본문으로 건너뛰기" }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "absolute left-0 top-0 z-[100]",
        "px-4 py-2 bg-primary text-primary-foreground",
        "transform -translate-y-full focus:translate-y-0",
        "transition-transform duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
    >
      {label}
    </a>
  );
}

/**
 * 라이브 리전 (Live Region)
 * 동적 콘텐츠 변경을 스크린 리더에 알림
 */
interface LiveRegionProps {
  /** 알림 메시지 */
  message: string;
  /** 긴급도 (polite: 대기, assertive: 즉시) */
  politeness?: "polite" | "assertive";
  /** 관련성 (additions: 추가, removals: 제거, text: 텍스트, all: 모두) */
  relevant?: "additions" | "removals" | "text" | "all" | "additions text";
}

export function LiveRegion({
  message,
  politeness = "polite",
  relevant = "all",
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * 포커스 트랩
 * 모달, 다이얼로그 등에서 포커스를 내부에 가둠
 */
interface FocusTrapProps {
  children: React.ReactNode;
  /** 활성화 여부 */
  active?: boolean;
  /** 처음 포커스할 요소 선택자 */
  initialFocus?: string;
  /** 포커스 탈출 시 콜백 */
  onEscape?: () => void;
}

export function FocusTrap({
  children,
  active = true,
  initialFocus,
  onEscape,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // 현재 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement;

    // 초기 포커스 설정
    const container = containerRef.current;
    if (container) {
      const focusTarget = initialFocus
        ? container.querySelector<HTMLElement>(initialFocus)
        : container.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
      focusTarget?.focus();
    }

    // 언마운트 시 이전 포커스 복원
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [active, initialFocus]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active) return;

      if (e.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusables = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    },
    [active, onEscape]
  );

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

/**
 * 키보드 포커스 표시기
 * 마우스 사용 시에는 숨기고 키보드 사용 시에만 표시
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return isFocusVisible;
}

/**
 * 고대비 모드 감지 훅
 */
export function useHighContrastMode() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: more)");
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isHighContrast;
}

/**
 * 모션 감소 설정 감지 훅
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * 접근 가능한 아이콘 버튼
 */
interface AccessibleIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 스크린 리더용 레이블 */
  label: string;
  /** 아이콘 */
  icon: React.ReactNode;
  /** 버튼 변형 */
  variant?: "default" | "ghost" | "outline";
  /** 크기 */
  size?: "sm" | "md" | "lg";
}

export function AccessibleIconButton({
  label,
  icon,
  variant = "default",
  size = "md",
  className,
  ...props
}: AccessibleIconButtonProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-muted",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

/**
 * 접근 가능한 로딩 상태
 */
interface AccessibleLoadingProps {
  /** 로딩 중 여부 */
  loading: boolean;
  /** 로딩 메시지 */
  message?: string;
  /** 완료 메시지 */
  completeMessage?: string;
  children: React.ReactNode;
}

export function AccessibleLoading({
  loading,
  message = "로딩 중...",
  completeMessage = "로딩 완료",
  children,
}: AccessibleLoadingProps) {
  const [announced, setAnnounced] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      setAnnounced(message);
    } else if (announced === message) {
      setAnnounced(completeMessage);
      // 완료 메시지 후 초기화
      const timer = setTimeout(() => setAnnounced(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, message, completeMessage, announced]);

  return (
    <>
      <div aria-busy={loading}>{children}</div>
      {announced && <LiveRegion message={announced} />}
    </>
  );
}

/**
 * 접근 가능한 에러 메시지
 */
interface AccessibleErrorProps {
  /** 에러 ID (폼 필드 연결용) */
  id: string;
  /** 에러 메시지 */
  message: string | null | undefined;
  className?: string;
}

export function AccessibleError({ id, message, className }: AccessibleErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn("text-sm text-destructive mt-1", className)}
    >
      {message}
    </p>
  );
}

/**
 * 접근성 설정 컨텍스트
 */
interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: "normal" | "large" | "x-large";
  setFontSize: (size: "normal" | "large" | "x-large") => void;
}

const AccessibilityContext = createContext<AccessibilitySettings | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const highContrast = useHighContrastMode();
  const [fontSize, setFontSize] = useState<"normal" | "large" | "x-large">("normal");

  // 폰트 크기 클래스 적용
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("text-base", "text-lg", "text-xl");

    switch (fontSize) {
      case "large":
        root.classList.add("text-lg");
        break;
      case "x-large":
        root.classList.add("text-xl");
        break;
      default:
        root.classList.add("text-base");
    }
  }, [fontSize]);

  return (
    <AccessibilityContext.Provider
      value={{ reducedMotion, highContrast, fontSize, setFontSize }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within AccessibilityProvider");
  }
  return context;
}

/**
 * 키보드 단축키 안내
 */
interface KeyboardShortcutsHelpProps {
  shortcuts: Array<{
    key: string;
    description: string;
  }>;
  className?: string;
}

export function KeyboardShortcutsHelp({ shortcuts, className }: KeyboardShortcutsHelpProps) {
  return (
    <div className={cn("space-y-2", className)} role="list" aria-label="키보드 단축키">
      {shortcuts.map((shortcut) => (
        <div
          key={shortcut.key}
          className="flex items-center justify-between"
          role="listitem"
        >
          <span className="text-sm text-muted-foreground">{shortcut.description}</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {shortcut.key}
          </kbd>
        </div>
      ))}
    </div>
  );
}
