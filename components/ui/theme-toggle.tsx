"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * 테마 토글 버튼 (아이콘만)
 * 클릭하면 라이트 → 다크 → 시스템 순으로 전환
 */
interface ThemeToggleProps {
  /** 버튼 변형 */
  variant?: "default" | "ghost" | "outline";
  /** 크기 */
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function ThemeToggle({
  variant = "ghost",
  size = "default",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 하이드레이션 문제 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  if (!mounted) {
    return (
      <Button variant={variant} size="icon" className={className} disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={cycleTheme}
      className={cn("relative overflow-hidden", className)}
      aria-label={`현재 테마: ${theme === "system" ? "시스템" : theme === "dark" ? "다크" : "라이트"}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {resolvedTheme === "dark" ? (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-4 w-4" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-4 w-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 시스템 모드 표시 */}
      {theme === "system" && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-blue-500 border border-background" />
      )}
    </Button>
  );
}

/**
 * 테마 선택 드롭다운
 * 라이트, 다크, 시스템 모드 중 선택
 */
interface ThemeDropdownProps {
  /** 트리거 버튼 변형 */
  variant?: "default" | "ghost" | "outline";
  /** 트리거 표시 방식 */
  showLabel?: boolean;
  className?: string;
}

export function ThemeDropdown({
  variant = "ghost",
  showLabel = false,
  className,
}: ThemeDropdownProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant={variant} className={className} disabled>
        <Sun className="h-4 w-4" />
        {showLabel && <span className="ml-2">테마</span>}
      </Button>
    );
  }

  const themeOptions = [
    { value: "light", label: "라이트", icon: Sun },
    { value: "dark", label: "다크", icon: Moon },
    { value: "system", label: "시스템", icon: Monitor },
  ];

  const currentTheme = themeOptions.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} className={className}>
          <CurrentIcon className="h-4 w-4" />
          {showLabel && <span className="ml-2">{currentTheme?.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>테마 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(isActive && "bg-muted")}
            >
              <Icon className="h-4 w-4 mr-2" />
              {option.label}
              {isActive && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 테마 미리보기 카드
 * 설정 페이지에서 테마 선택에 사용
 */
interface ThemePreviewCardProps {
  /** 테마 값 */
  value: "light" | "dark" | "system";
  /** 선택됨 여부 */
  selected: boolean;
  /** 선택 핸들러 */
  onSelect: () => void;
}

export function ThemePreviewCard({ value, selected, onSelect }: ThemePreviewCardProps) {
  const labels = {
    light: "라이트 모드",
    dark: "다크 모드",
    system: "시스템 설정",
  };

  const descriptions = {
    light: "밝은 배경에 어두운 텍스트",
    dark: "어두운 배경에 밝은 텍스트",
    system: "기기 설정을 따릅니다",
  };

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const Icon = icons[value];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all",
        "hover:border-primary/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-slate-200 dark:border-slate-700"
      )}
    >
      {/* 미리보기 */}
      <div
        className={cn(
          "w-full h-20 rounded-lg mb-3 overflow-hidden",
          "border border-slate-200 dark:border-slate-600"
        )}
      >
        {value === "light" && (
          <div className="h-full bg-white flex flex-col">
            <div className="h-4 bg-slate-100 border-b border-slate-200" />
            <div className="flex-1 p-2 space-y-1">
              <div className="h-2 bg-slate-200 rounded w-3/4" />
              <div className="h-2 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        )}
        {value === "dark" && (
          <div className="h-full bg-slate-900 flex flex-col">
            <div className="h-4 bg-slate-800 border-b border-slate-700" />
            <div className="flex-1 p-2 space-y-1">
              <div className="h-2 bg-slate-700 rounded w-3/4" />
              <div className="h-2 bg-slate-700 rounded w-1/2" />
            </div>
          </div>
        )}
        {value === "system" && (
          <div className="h-full flex">
            <div className="w-1/2 bg-white flex flex-col">
              <div className="h-4 bg-slate-100" />
              <div className="flex-1 p-1 space-y-0.5">
                <div className="h-1.5 bg-slate-200 rounded w-3/4" />
                <div className="h-1.5 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
            <div className="w-1/2 bg-slate-900 flex flex-col">
              <div className="h-4 bg-slate-800" />
              <div className="flex-1 p-1 space-y-0.5">
                <div className="h-1.5 bg-slate-700 rounded w-3/4" />
                <div className="h-1.5 bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 아이콘 & 라벨 */}
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("font-medium text-sm", selected && "text-primary")}>
          {labels[value]}
        </span>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {descriptions[value]}
      </p>

      {/* 선택 표시 */}
      {selected && (
        <motion.div
          layoutId="theme-selected"
          className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center"
        >
          <svg
            className="h-3 w-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      )}
    </button>
  );
}

/**
 * 테마 선택 그룹
 * 설정 페이지용
 */
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {["light", "dark", "system"].map((value) => (
          <div
            key={value}
            className="h-32 rounded-xl border-2 border-slate-200 dark:border-slate-700 animate-pulse bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <ThemePreviewCard
        value="light"
        selected={theme === "light"}
        onSelect={() => setTheme("light")}
      />
      <ThemePreviewCard
        value="dark"
        selected={theme === "dark"}
        onSelect={() => setTheme("dark")}
      />
      <ThemePreviewCard
        value="system"
        selected={theme === "system"}
        onSelect={() => setTheme("system")}
      />
    </div>
  );
}

/**
 * 색상 테마 선택 (미래 확장용)
 */
interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  description: string;
}

const COLOR_THEMES: ColorTheme[] = [
  { id: "default", name: "기본", primary: "#22c55e", description: "깔끔한 그린" },
  { id: "blue", name: "블루", primary: "#3b82f6", description: "시원한 블루" },
  { id: "violet", name: "바이올렛", primary: "#8b5cf6", description: "우아한 퍼플" },
  { id: "rose", name: "로즈", primary: "#f43f5e", description: "생동감 있는 핑크" },
  { id: "amber", name: "앰버", primary: "#f59e0b", description: "따뜻한 오렌지" },
];

interface ColorThemeSelectorProps {
  currentTheme: string;
  onSelect: (themeId: string) => void;
}

export function ColorThemeSelector({ currentTheme, onSelect }: ColorThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">색상 테마</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {COLOR_THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelect(theme.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
              currentTheme === theme.id
                ? "border-primary bg-primary/5"
                : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
            )}
            title={theme.description}
          >
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
            <span className="text-sm">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
