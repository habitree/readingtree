"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface StatusItem {
  name: string;
  enabled: boolean;
}

interface StatusOverviewBarProps {
  services: StatusItem[];
}

export function StatusOverviewBar({ services }: StatusOverviewBarProps) {
  const { t } = useTranslation();
  const activeCount = services.filter((s) => s.enabled).length;
  const totalCount = services.length;

  return (
    <Card variant="glass">
      <CardContent className="py-4 px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* 라벨 */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-forest-600 dark:text-forest-400" />
            <span className="text-sm font-medium">{t("admin.apiInfo.serviceStatus")}</span>
            <span className="text-xs text-muted-foreground">
              {t("admin.apiInfo.activeCount", { active: activeCount, total: totalCount })}
            </span>
          </div>

          {/* 서비스 목록 */}
          <div className="flex flex-wrap gap-3">
            {services.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-1.5"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75",
                      service.enabled
                        ? "animate-ping bg-green-400"
                        : "bg-red-400"
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex h-2.5 w-2.5 rounded-full",
                      service.enabled ? "bg-green-500" : "bg-red-500"
                    )}
                  />
                </span>
                <span className="text-xs text-muted-foreground">
                  {service.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
