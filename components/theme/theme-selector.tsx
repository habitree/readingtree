"use client";

import * as React from "react";
import { Moon, Sun, Trees, TreePine } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

type Theme = "light" | "dark" | "forest" | "forest-dark";

export function ThemeSelector() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 마운트 후에만 테마 표시 (hydration 오류 방지)
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10">
        <Sun className="h-5 w-5" />
      </Button>
    );
  }

  const currentTheme = (theme || "light") as Theme;

  const themeConfig: Record<Theme, { icon: typeof Sun; label: string }> = {
    light: { icon: Sun, label: t("theme.dayTheme") },
    dark: { icon: Moon, label: t("theme.nightTheme") },
    forest: { icon: Trees, label: t("theme.forestLight") },
    "forest-dark": { icon: TreePine, label: t("theme.forestDark") },
  };

  const CurrentIcon = themeConfig[currentTheme]?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label={t("theme.selectTheme")}>
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* 기본 테마 */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>{t("theme.dayTheme")}</span>
          {currentTheme === "light" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>{t("theme.nightTheme")}</span>
          {currentTheme === "dark" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Forest 테마 */}
        <DropdownMenuItem onClick={() => setTheme("forest")}>
          <Trees className="mr-2 h-4 w-4 text-green-600" />
          <span>{t("theme.forestLight")}</span>
          {currentTheme === "forest" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("forest-dark")}>
          <TreePine className="mr-2 h-4 w-4 text-green-700" />
          <span>{t("theme.forestDark")}</span>
          {currentTheme === "forest-dark" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

