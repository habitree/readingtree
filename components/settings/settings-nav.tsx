"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  Download,
  Lock,
  LucideIcon,
  Navigation,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface SettingsNavItem {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

const ITEMS: SettingsNavItem[] = [
  { href: "/settings", label: "계정", description: "이메일·비밀번호", icon: User },
  { href: "/settings/reading", label: "독서 목표", description: "연간/월간 목표", icon: BookOpen },
  { href: "/settings/notifications", label: "알림", description: "알림 수신 토글", icon: Bell },
  { href: "/settings/privacy", label: "프라이버시", description: "공개/비공개", icon: Lock },
  { href: "/settings/export", label: "내보내기", description: "Markdown 일괄", icon: Download },
  { href: "/settings/navigation", label: "네비게이션", description: "모바일 탭 고정", icon: Navigation },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="설정 메뉴" className="flex flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
      <ul className="flex gap-1 lg:flex-col lg:gap-0">
        {ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/settings" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors lg:border-transparent",
                  isActive
                    ? "bg-primary text-primary-foreground lg:bg-muted lg:text-foreground lg:border-border"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.label}</p>
                  {item.description && (
                    <p className="mt-0.5 hidden text-[11px] leading-tight text-muted-foreground lg:block">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
