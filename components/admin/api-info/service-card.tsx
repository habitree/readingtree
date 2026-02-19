"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  Shield,
  Key,
  Search,
  Globe,
  Library,
  BookOpen,
  Zap,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const ICON_MAP: Record<string, React.ElementType> = {
  shield: Shield,
  key: Key,
  search: Search,
  globe: Globe,
  library: Library,
  bookOpen: BookOpen,
  zap: Zap,
  bot: Bot,
};

const ACCENT_GRADIENTS: Record<string, string> = {
  auth: "from-emerald-400 to-emerald-600",
  search: "from-blue-400 to-blue-600",
  ocr: "from-purple-400 to-purple-600",
  pageCount: "from-amber-400 to-amber-600",
  deploy: "from-sky-400 to-sky-600",
  ai: "from-pink-400 to-pink-600",
};

interface ServiceCardProps {
  id?: string;
  icon: string;
  provider: string;
  enabled: boolean;
  category: string;
  previewBadges: string[];
  apiReference?: string;
  children: React.ReactNode;
  className?: string;
}

export function ServiceCard({
  id,
  icon,
  provider,
  enabled,
  category,
  previewBadges,
  apiReference,
  children,
  className,
}: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const Icon = ICON_MAP[icon] || Globe;
  const accentGradient = ACCENT_GRADIENTS[category] || "from-slate-400 to-slate-600";

  return (
    <Card
      id={id}
      variant="glass"
      className={cn("overflow-hidden scroll-mt-20", className)}
    >
      {/* Accent Bar */}
      <div className={cn("h-1 bg-gradient-to-r", accentGradient)} />

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                enabled
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{provider}</div>
            </div>
          </div>

          {/* Status Badge with Pulsing Dot */}
          <Badge
            variant={enabled ? "default" : "destructive"}
            className="flex items-center gap-1.5 flex-shrink-0"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  enabled ? "animate-ping bg-green-300" : "bg-red-300"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  enabled ? "bg-green-400" : "bg-red-400"
                )}
              />
            </span>
            {enabled ? t("admin.apiInfo.statusEnabled") : t("admin.apiInfo.statusDisabled")}
          </Badge>
        </div>

        {/* Preview Badges */}
        {previewBadges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {previewBadges.slice(0, 3).map((badge) => (
              <Badge key={badge} variant="outline" className="text-[10px] px-1.5 py-0">
                {badge}
              </Badge>
            ))}
            {previewBadges.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{previewBadges.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Expandable Content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t space-y-3">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
            {expanded ? t("admin.apiInfo.collapse") : t("admin.apiInfo.expand")}
          </button>

          {apiReference && (
            <a
              href={apiReference}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
            >
              {t("admin.apiInfo.officialDocs")}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** 서비스 카드 상세 섹션 내부에서 키/값 정보를 표시하는 헬퍼 */
export function ServiceDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground mb-0.5">
        {label}
      </div>
      <div className="text-xs font-mono break-all">{value}</div>
    </div>
  );
}

/** 기능 목록 표시 헬퍼 */
export function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-1">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
