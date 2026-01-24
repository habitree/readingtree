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

type Theme = "light" | "dark" | "forest" | "forest-dark";

export function ThemeSelector() {
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
    light: { icon: Sun, label: "낮 테마" },
    dark: { icon: Moon, label: "밤 테마" },
    forest: { icon: Trees, label: "숲 (밝음)" },
    "forest-dark": { icon: TreePine, label: "숲 (어둠)" },
  };

  const CurrentIcon = themeConfig[currentTheme]?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="테마 선택">
          <CurrentIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* 기본 테마 */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>낮 테마</span>
          {currentTheme === "light" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>밤 테마</span>
          {currentTheme === "dark" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Forest 테마 */}
        <DropdownMenuItem onClick={() => setTheme("forest")}>
          <Trees className="mr-2 h-4 w-4 text-green-600" />
          <span>숲 (밝음)</span>
          {currentTheme === "forest" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("forest-dark")}>
          <TreePine className="mr-2 h-4 w-4 text-green-700" />
          <span>숲 (어둠)</span>
          {currentTheme === "forest-dark" && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

