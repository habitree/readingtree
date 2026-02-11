"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Key,
  Search,
  Globe,
  Library,
  BookOpen,
  Zap,
  Cloud,
  Users,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceNodeConfig } from "./types";

interface ConnectionGraphProps {
  services: ServiceNodeConfig[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  shield: Shield,
  key: Key,
  search: Search,
  globe: Globe,
  library: Library,
  bookOpen: BookOpen,
  zap: Zap,
  cloud: Cloud,
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  search: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
  ocr: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
  pageCount: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  deploy: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
};

const CATEGORY_ICON_COLORS: Record<string, string> = {
  auth: "text-emerald-600 dark:text-emerald-400",
  search: "text-blue-600 dark:text-blue-400",
  ocr: "text-purple-600 dark:text-purple-400",
  pageCount: "text-amber-600 dark:text-amber-400",
  deploy: "text-sky-600 dark:text-sky-400",
};

function ServiceNode({
  service,
  index,
}: {
  service: ServiceNodeConfig;
  index: number;
}) {
  const Icon = ICON_MAP[service.icon] || Globe;
  const colorClass = CATEGORY_COLORS[service.category];
  const iconColor = CATEGORY_ICON_COLORS[service.category];

  const handleClick = () => {
    if (service.externalUrl) {
      window.open(service.externalUrl, "_blank", "noopener,noreferrer");
    } else if (service.scrollTarget) {
      document
        .getElementById(service.scrollTarget)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl border",
        "bg-gradient-to-b backdrop-blur-sm cursor-pointer",
        "transition-shadow hover:shadow-lg",
        colorClass
      )}
    >
      {/* Pulsing Status Dot */}
      <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            service.enabled ? "animate-ping bg-green-400" : "bg-red-400"
          )}
        />
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            service.enabled ? "bg-green-500" : "bg-red-500"
          )}
        />
      </span>

      <Icon className={cn("h-6 w-6", iconColor)} />
      <span className="text-xs font-semibold text-center leading-tight">
        {service.name}
      </span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">
        {service.description}
      </span>

      {service.externalUrl && (
        <ExternalLink className="h-3 w-3 text-muted-foreground/50 absolute bottom-2 right-2" />
      )}
    </motion.button>
  );
}

export function ConnectionGraph({ services }: ConnectionGraphProps) {
  const authServices = services.filter((s) => s.category === "auth");
  const searchServices = services.filter((s) => s.category === "search");
  const ocrServices = services.filter((s) => s.category === "ocr");
  const pageCountServices = services.filter((s) => s.category === "pageCount");
  const deployServices = services.filter((s) => s.category === "deploy");

  return (
    <div className="relative rounded-2xl border bg-gradient-to-br from-slate-50/80 via-white/60 to-slate-100/80 dark:from-slate-900/80 dark:via-slate-800/60 dark:to-slate-900/80 backdrop-blur-sm p-6 overflow-hidden">
      {/* 배경 데코레이션 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-forest-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* 타이틀 */}
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            서비스 연결 구조
          </span>
        </div>

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid md:grid-cols-5 gap-4 items-start">
          {/* 좌: 인증 */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              인증
            </div>
            {authServices.map((s, i) => (
              <ServiceNode key={s.id} service={s} index={i} />
            ))}
          </div>

          {/* Connector */}
          <div className="flex items-center justify-center self-center">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-forest-400/50 to-transparent" />
          </div>

          {/* 중앙: Hub */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="flex flex-col items-center gap-3 self-center"
          >
            <div className="relative p-6 rounded-2xl border-2 border-forest-500/40 bg-gradient-to-br from-forest-500/10 to-forest-600/5 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 rounded-2xl bg-forest-500/5 animate-pulse" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-xl bg-forest-500/20 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-forest-600 dark:text-forest-400" />
                </div>
                <span className="text-sm font-bold">Habitree App</span>
                <span className="text-[10px] text-muted-foreground">
                  Next.js + Supabase
                </span>
              </div>
            </div>
          </motion.div>

          {/* Connector */}
          <div className="flex items-center justify-center self-center">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-forest-400/50 to-transparent" />
          </div>

          {/* 우: 서비스 그룹 */}
          <div className="space-y-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
              외부 서비스
            </div>
            {[...searchServices, ...ocrServices].map((s, i) => (
              <ServiceNode key={s.id} service={s} index={i + 2} />
            ))}
          </div>
        </div>

        {/* Desktop: 하단 서비스 (페이지수 + 배포) */}
        <div className="hidden md:block mt-4">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-forest-400/30 to-transparent mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {/* 페이지 수 API */}
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                페이지 수 조회
              </div>
              <div className="grid grid-cols-3 gap-2">
                {pageCountServices.map((s, i) => (
                  <ServiceNode key={s.id} service={s} index={i + 5} />
                ))}
              </div>
            </div>
            {/* 배포 */}
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                배포
              </div>
              <div className="grid grid-cols-1 gap-2">
                {deployServices.map((s, i) => (
                  <ServiceNode key={s.id} service={s} index={i + 8} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: 세로 스택 */}
        <div className="md:hidden space-y-4">
          {/* Hub */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 150, damping: 15 }}
            className="flex flex-col items-center"
          >
            <div className="relative p-5 rounded-2xl border-2 border-forest-500/40 bg-gradient-to-br from-forest-500/10 to-forest-600/5 backdrop-blur-sm shadow-lg">
              <div className="absolute inset-0 rounded-2xl bg-forest-500/5 animate-pulse" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-forest-500/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-forest-600 dark:text-forest-400" />
                </div>
                <span className="text-sm font-bold">Habitree App</span>
                <span className="text-[10px] text-muted-foreground">
                  Next.js + Supabase
                </span>
              </div>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-forest-400/30 to-transparent" />

          {/* 카테고리별 그룹 */}
          {[
            { label: "인증", items: authServices },
            { label: "검색", items: searchServices },
            { label: "OCR", items: ocrServices },
            { label: "페이지 수 조회", items: pageCountServices },
            { label: "배포", items: deployServices },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {group.label}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((s, i) => (
                    <ServiceNode key={s.id} service={s} index={i} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
