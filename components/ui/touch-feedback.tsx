"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * 터치 리플 이펙트
 * Material Design 스타일의 터치 피드백
 */
interface TouchRippleProps {
  children: React.ReactNode;
  /** 리플 색상 */
  color?: string;
  /** 비활성화 */
  disabled?: boolean;
  className?: string;
}

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

export function TouchRipple({
  children,
  color = "currentColor",
  disabled = false,
  className,
}: TouchRippleProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const addRipple = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple: Ripple = {
        x,
        y,
        size,
        id: nextId.current++,
      };

      setRipples((prev) => [...prev, ripple]);

      // 리플 제거
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    },
    [disabled]
  );

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onMouseDown={addRipple}
      onTouchStart={addRipple}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.3 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: color,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * 스와이프 가능한 컨테이너
 * 좌우 스와이프 동작 감지
 */
interface SwipeableProps {
  children: React.ReactNode;
  /** 왼쪽 스와이프 핸들러 */
  onSwipeLeft?: () => void;
  /** 오른쪽 스와이프 핸들러 */
  onSwipeRight?: () => void;
  /** 위로 스와이프 핸들러 */
  onSwipeUp?: () => void;
  /** 아래로 스와이프 핸들러 */
  onSwipeDown?: () => void;
  /** 스와이프 감지 임계값 (픽셀) */
  threshold?: number;
  className?: string;
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className,
}: SwipeableProps) {
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // 수평 스와이프
      if (Math.abs(offset.x) > Math.abs(offset.y)) {
        if (offset.x > threshold || velocity.x > 500) {
          onSwipeRight?.();
        } else if (offset.x < -threshold || velocity.x < -500) {
          onSwipeLeft?.();
        }
      }
      // 수직 스와이프
      else {
        if (offset.y > threshold || velocity.y > 500) {
          onSwipeDown?.();
        } else if (offset.y < -threshold || velocity.y < -500) {
          onSwipeUp?.();
        }
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]
  );

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragEnd={handleDragEnd}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * 스와이프로 삭제 가능한 아이템
 */
interface SwipeToDeleteProps {
  children: React.ReactNode;
  /** 삭제 핸들러 */
  onDelete: () => void;
  /** 삭제 배경 콘텐츠 */
  deleteContent?: React.ReactNode;
  /** 삭제 임계값 (컨테이너 너비의 비율) */
  deleteThreshold?: number;
  className?: string;
}

export function SwipeToDelete({
  children,
  onDelete,
  deleteContent,
  deleteThreshold = 0.3,
  className,
}: SwipeToDeleteProps) {
  const [dragX, setDragX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setDragX(info.offset.x);
    },
    []
  );

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.offsetWidth;
      const threshold = containerWidth * deleteThreshold;

      if (info.offset.x < -threshold || info.velocity.x < -500) {
        onDelete();
      }

      setDragX(0);
    },
    [deleteThreshold, onDelete]
  );

  const deleteProgress = Math.min(Math.abs(dragX) / 100, 1);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* 삭제 배경 */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end px-4 bg-destructive text-destructive-foreground"
        style={{ width: Math.abs(dragX) }}
      >
        <motion.div
          animate={{ scale: deleteProgress > 0.5 ? 1.2 : 1 }}
          className="opacity-90"
        >
          {deleteContent || (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </motion.div>
      </div>

      {/* 메인 콘텐츠 */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -150, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: 0 }}
        className="relative bg-background"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * 롱프레스 감지 훅
 */
interface UseLongPressOptions {
  /** 롱프레스 콜백 */
  onLongPress: () => void;
  /** 일반 클릭 콜백 */
  onClick?: () => void;
  /** 롱프레스 감지 시간 (ms) */
  delay?: number;
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 500,
}: UseLongPressOptions) {
  const [isLongPress, setIsLongPress] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRef = useRef<EventTarget | null>(null);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      targetRef.current = e.target;
      timeoutRef.current = setTimeout(() => {
        setIsLongPress(true);
        onLongPress();
      }, delay);
    },
    [delay, onLongPress]
  );

  const clear = useCallback(
    (e: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (shouldTriggerClick && !isLongPress && onClick && targetRef.current === e.target) {
        onClick();
      }

      setIsLongPress(false);
    },
    [isLongPress, onClick]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: clear,
  };
}

/**
 * 핀치 줌 지원 컴포넌트
 */
interface PinchZoomProps {
  children: React.ReactNode;
  /** 최소 줌 레벨 */
  minScale?: number;
  /** 최대 줌 레벨 */
  maxScale?: number;
  /** 줌 변경 콜백 */
  onZoomChange?: (scale: number) => void;
  className?: string;
}

export function PinchZoom({
  children,
  minScale = 1,
  maxScale = 3,
  onZoomChange,
  className,
}: PinchZoomProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastDistanceRef = useRef<number | null>(null);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 2) return;

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastDistanceRef.current !== null) {
        const delta = distance - lastDistanceRef.current;
        const newScale = Math.min(maxScale, Math.max(minScale, scale + delta * 0.01));
        setScale(newScale);
        onZoomChange?.(newScale);
      }

      lastDistanceRef.current = distance;
    },
    [scale, minScale, maxScale, onZoomChange]
  );

  const handleTouchEnd = useCallback((_e: React.TouchEvent) => {
    lastDistanceRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    const newScale = scale === 1 ? 2 : 1;
    setScale(newScale);
    setPosition({ x: 0, y: 0 });
    onZoomChange?.(newScale);
  }, [scale, onZoomChange]);

  return (
    <div
      className={cn("overflow-hidden touch-none", className)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <motion.div
        animate={{ scale, x: position.x, y: position.y }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        drag={scale > 1}
        dragConstraints={{
          left: -(scale - 1) * 100,
          right: (scale - 1) * 100,
          top: -(scale - 1) * 100,
          bottom: (scale - 1) * 100,
        }}
        onDragEnd={(_, info) => {
          setPosition({ x: info.point.x, y: info.point.y });
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * 햅틱 피드백 훅 (모바일)
 */
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(20), [vibrate]);
  const heavyTap = useCallback(() => vibrate(30), [vibrate]);
  const success = useCallback(() => vibrate([10, 30, 10]), [vibrate]);
  const error = useCallback(() => vibrate([50, 30, 50]), [vibrate]);

  return { vibrate, lightTap, mediumTap, heavyTap, success, error };
}

/**
 * 터치 영역 확대 래퍼
 * 작은 터치 대상의 터치 영역을 확대
 */
interface TouchTargetProps {
  children: React.ReactNode;
  /** 최소 터치 영역 크기 (px) */
  minSize?: number;
  className?: string;
}

export function TouchTarget({
  children,
  minSize = 44, // WCAG 권장 최소 터치 대상 크기
  className,
}: TouchTargetProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ minWidth: minSize, minHeight: minSize }}
    >
      {/* 터치 영역 확대 */}
      <div
        className="absolute inset-0 -m-2"
        style={{
          margin: `-${(minSize - 24) / 2}px`,
        }}
      />
      {/* 실제 콘텐츠 */}
      <div className="relative flex items-center justify-center w-full h-full">
        {children}
      </div>
    </div>
  );
}
