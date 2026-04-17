"use client";

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  forwardRef,
  type ReactElement,
  type ReactNode,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";

/**
 * 경량 Popover 구현 (radix 미의존).
 * - 토글식 열림/닫힘
 * - outside click으로 닫힘
 * - Escape로 닫힘
 * - `align`과 `sideOffset`으로 위치 조정
 */

type PopoverAlign = "start" | "center" | "end";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  contentId: string;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopover() {
  const ctx = useContext(PopoverContext);
  if (!ctx) {
    throw new Error("Popover 서브 컴포넌트는 <Popover> 내부에서 사용해야 해요.");
  }
  return ctx;
}

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

export function Popover({ open: controlledOpen, onOpenChange, children }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const contentId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  const value = useMemo<PopoverContextValue>(
    () => ({ open, setOpen, triggerRef, contentRef, contentId }),
    [open, setOpen, contentId],
  );

  return (
    <PopoverContext.Provider value={value}>
      <span className="relative inline-block">{children}</span>
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: ReactNode;
}

/**
 * 현재는 asChild 모드만 지원한다 (shadcn 컨벤션과 일치).
 * 단일 자식 요소를 받아 ref와 onClick을 주입한다.
 */
export function PopoverTrigger({ asChild = true, children }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = usePopover();

  if (!asChild) {
    return (
      <button
        type="button"
        ref={(node) => {
          triggerRef.current = node;
        }}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {children}
      </button>
    );
  }

  if (!isValidElement(children)) return null;

  const child = children as ReactElement<{
    onClick?: (event: MouseEvent) => void;
    ref?: React.Ref<HTMLElement>;
    "aria-expanded"?: boolean;
  }>;

  const mergedOnClick = (event: MouseEvent) => {
    child.props.onClick?.(event);
    if (!event.defaultPrevented) {
      setOpen(!open);
    }
  };

  const origRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
  const mergedRef = (node: HTMLElement | null) => {
    triggerRef.current = node;
    if (typeof origRef === "function") origRef(node);
    else if (origRef && "current" in origRef) {
      (origRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  return cloneElement(child, {
    onClick: mergedOnClick,
    "aria-expanded": open,
    ref: mergedRef,
  } as Record<string, unknown>);
}

interface PopoverContentProps {
  align?: PopoverAlign;
  sideOffset?: number;
  className?: string;
  children: ReactNode;
}

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    { align = "center", sideOffset = 8, className, children }: PopoverContentProps,
    forwardedRef,
  ) {
    const { open, contentRef, contentId } = usePopover();
    if (!open) return null;

    const alignClass =
      align === "end"
        ? "right-0"
        : align === "start"
          ? "left-0"
          : "left-1/2 -translate-x-1/2";

    return (
      <div
        id={contentId}
        role="dialog"
        ref={(node) => {
          contentRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef && "current" in forwardedRef)
            (forwardedRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        style={{ top: `calc(100% + ${sideOffset}px)` }}
        className={cn(
          "absolute z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95",
          alignClass,
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
