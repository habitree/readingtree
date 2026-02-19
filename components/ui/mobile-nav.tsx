"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  PenLine,
  Users,
  User,
  Plus,
  Menu,
  X,
  MessageSquare,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface NavItem {
  href: string;
  icon: typeof Home;
  labelKey: "nav.home" | "nav.bookshelf" | "nav.notes" | "nav.community" | "nav.profile";
  activePattern?: RegExp;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: Home, labelKey: "nav.home" },
  { href: "/books", icon: BookOpen, labelKey: "nav.bookshelf", activePattern: /^\/books/ },
  { href: "/notes", icon: PenLine, labelKey: "nav.notes", activePattern: /^\/notes/ },
  { href: "/groups", icon: Users, labelKey: "nav.community", activePattern: /^\/groups/ },
  { href: "/profile", icon: User, labelKey: "nav.profile", activePattern: /^\/profile/ },
];

interface MobileBottomNavProps {
  /** FAB (Floating Action Button) 표시 여부 */
  showFab?: boolean;
  /** FAB 클릭 핸들러 */
  onFabClick?: () => void;
  className?: string;
}

/**
 * 모바일 하단 네비게이션 바
 *
 * iOS/Android 스타일의 하단 탭 바로 모바일 경험을 개선합니다.
 * - 현재 페이지 하이라이트
 * - 부드러운 애니메이션
 * - Safe area 지원
 */
export function MobileBottomNav({
  showFab = true,
  onFabClick,
  className,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // 스크롤 시 네비게이션 숨기기/보이기
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // 아래로 스크롤 시 숨기기 (50px 이상 스크롤 시)
      if (scrollDiff > 10 && currentScrollY > 100) {
        setIsVisible(false);
      }
      // 위로 스크롤 시 보이기
      else if (scrollDiff < -10) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const isActive = useCallback(
    (item: NavItem) => {
      if (item.activePattern) {
        return item.activePattern.test(pathname);
      }
      return pathname === item.href;
    },
    [pathname]
  );

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg",
        "border-t border-slate-200 dark:border-slate-800",
        "pb-safe", // iOS safe area
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full",
                "transition-colors duration-200",
                "active:scale-95"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                />
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 transition-colors",
                  active ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Floating Action Button */}
      {showFab && (
        <motion.button
          onClick={onFabClick}
          className={cn(
            "absolute -top-7 left-1/2 -translate-x-1/2",
            "h-14 w-14 rounded-full",
            "bg-primary text-primary-foreground shadow-lg",
            "flex items-center justify-center",
            "active:scale-95 transition-transform"
          )}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}
    </motion.nav>
  );
}

/**
 * 모바일 풀스크린 메뉴
 */
interface MobileFullMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileFullMenu({ open, onClose }: MobileFullMenuProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold">{t("nav.menu")}</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t("nav.closeMenu")}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 메뉴 아이템 */}
          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const active = pathname === item.href ||
                (item.activePattern && item.activePattern.test(pathname));

              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-lg font-medium">{t(item.labelKey)}</span>
                  </Link>
                </motion.div>
              );
            })}

            {/* 추가 메뉴 */}
            <div className="pt-4 border-t mt-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: NAV_ITEMS.length * 0.05 }}
              >
                <Link
                  href="/chat"
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
                >
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-lg font-medium">{t("chat.aiChat")}</span>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (NAV_ITEMS.length + 1) * 0.05 }}
              >
                <Link
                  href="/search"
                  onClick={onClose}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-muted transition-colors"
                >
                  <Search className="h-6 w-6" />
                  <span className="text-lg font-medium">{t("nav.search")}</span>
                </Link>
              </motion.div>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 모바일 헤더 컴포넌트
 */
interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  rightContent?: React.ReactNode;
  className?: string;
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  showMenu = true,
  rightContent,
  className,
}: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 md:hidden",
          "flex items-center justify-between h-14 px-4",
          "bg-background/95 backdrop-blur-lg",
          "border-b border-slate-200 dark:border-slate-800",
          className
        )}
      >
        {/* 왼쪽 */}
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t("nav.goBack")}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>

        {/* 오른쪽 */}
        <div className="flex items-center gap-2">
          {rightContent}
          {showMenu && (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t("nav.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <MobileFullMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

/**
 * 모바일 Pull-to-Refresh 컴포넌트
 */
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const threshold = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling) return;
      const touch = e.touches[0];
      const distance = Math.max(0, touch.clientY - 100);
      setPullDistance(Math.min(distance, threshold * 1.5));
    },
    [isPulling]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 리프레시 인디케이터 */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: pullDistance / 2 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-1/2 -translate-x-1/2 z-10"
          >
            <div
              className={cn(
                "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center",
                isRefreshing && "animate-spin"
              )}
            >
              <svg
                className="h-5 w-5 text-primary"
                style={{
                  transform: `rotate(${progress * 360}deg)`,
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 콘텐츠 */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance / 3}px)` : undefined,
          transition: isPulling ? "none" : "transform 0.2s",
        }}
      >
        {children}
      </div>
    </div>
  );
}
