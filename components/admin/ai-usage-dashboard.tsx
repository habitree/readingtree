"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AdminStatsCard } from "./admin-stats-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ScanLine, FileBarChart, Coins, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { AIUsageSummary, AIUsageByUser, AIUsageMonthlyTrend } from "@/app/actions/admin/ai-usage";

interface AIUsageDashboardProps {
  summary: AIUsageSummary;
  userUsage: AIUsageByUser[];
  monthlyTrend: AIUsageMonthlyTrend[];
}

export function AIUsageDashboard({ summary, userUsage, monthlyTrend }: AIUsageDashboardProps) {
  const { t } = useTranslation();

  const maxMonthlyTotal = Math.max(
    ...monthlyTrend.map((m) => m.aiChat + m.ocr + m.aiReport),
    1
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin.aiUsage.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("admin.aiUsage.subtitle")}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title={t("admin.aiUsage.totalAiChat")}
          value={summary.totalAiChat.toLocaleString()}
          description={t("admin.aiUsage.thisMonth", { count: summary.monthAiChat })}
          icon={MessageSquare}
          colorClassName="border-l-blue-500"
          iconColorClassName="bg-blue-500/10 text-blue-600"
        />
        <AdminStatsCard
          title={t("admin.aiUsage.totalOcr")}
          value={summary.totalOcr.toLocaleString()}
          description={t("admin.aiUsage.thisMonth", { count: summary.monthOcr })}
          icon={ScanLine}
          colorClassName="border-l-purple-500"
          iconColorClassName="bg-purple-500/10 text-purple-600"
        />
        <AdminStatsCard
          title={t("admin.aiUsage.totalAiReport")}
          value={summary.totalAiReport.toLocaleString()}
          description={t("admin.aiUsage.thisMonth", { count: summary.monthAiReport })}
          icon={FileBarChart}
          colorClassName="border-l-green-500"
          iconColorClassName="bg-green-500/10 text-green-600"
        />
        <AdminStatsCard
          title={t("admin.aiUsage.monthEstimatedCost")}
          value={`${summary.monthEstimatedCost.toLocaleString()}원`}
          description={t("admin.aiUsage.totalCost", { cost: summary.totalEstimatedCost.toLocaleString() })}
          icon={Coins}
          colorClassName="border-l-orange-500"
          iconColorClassName="bg-orange-500/10 text-orange-600"
        />
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <CardTitle>{t("admin.aiUsage.monthlyTrend")}</CardTitle>
          </div>
          <CardDescription>{t("admin.aiUsage.monthlyTrendDesc")}</CardDescription>
          {/* Legend */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-xs text-muted-foreground">{t("admin.aiUsage.aiChat")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-purple-500" />
              <span className="text-xs text-muted-foreground">{t("admin.aiUsage.ocr")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-xs text-muted-foreground">{t("admin.aiUsage.report")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-end justify-between gap-4 px-6 pb-8">
          {monthlyTrend.map((item, i) => {
            const total = item.aiChat + item.ocr + item.aiReport;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-0.5">
                  {/* AI Chat bar */}
                  <div
                    className="flex-1 bg-blue-500/80 hover:bg-blue-500 transition-all rounded-t-md relative"
                    style={{
                      height: `${Math.max((item.aiChat / maxMonthlyTotal) * 220, item.aiChat > 0 ? 8 : 0)}px`,
                    }}
                  >
                    {item.aiChat > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.aiChat}
                      </span>
                    )}
                  </div>
                  {/* OCR bar */}
                  <div
                    className="flex-1 bg-purple-500/80 hover:bg-purple-500 transition-all rounded-t-md relative"
                    style={{
                      height: `${Math.max((item.ocr / maxMonthlyTotal) * 220, item.ocr > 0 ? 8 : 0)}px`,
                    }}
                  >
                    {item.ocr > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.ocr}
                      </span>
                    )}
                  </div>
                  {/* Report bar */}
                  <div
                    className="flex-1 bg-green-500/80 hover:bg-green-500 transition-all rounded-t-md relative"
                    style={{
                      height: `${Math.max((item.aiReport / maxMonthlyTotal) * 220, item.aiReport > 0 ? 8 : 0)}px`,
                    }}
                  >
                    {item.aiReport > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.aiReport}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-xs text-muted-foreground font-medium block">{item.month}</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    {t("admin.aiUsage.totalCount", { count: total })}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* User Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.aiUsage.userUsageTitle")}</CardTitle>
          <CardDescription>{t("admin.aiUsage.userUsageDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {userUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("admin.aiUsage.noData")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("admin.aiUsage.user")}</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.aiUsage.aiChat")}</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.aiUsage.ocr")}</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.aiUsage.report")}</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.aiUsage.total")}</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.aiUsage.estimatedCost")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userUsage.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl || ""} />
                            <AvatarFallback>{user.name[0] ?? "?"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.aiChatCount > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {user.aiChatCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.ocrCount > 0 ? (
                          <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-700">
                            {user.ocrCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.aiReportCount > 0 ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700">
                            {user.aiReportCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {user.totalCount}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        {user.estimatedCost.toLocaleString()}원
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
