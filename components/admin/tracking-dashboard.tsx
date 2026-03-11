"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AdminStatsCard } from "./admin-stats-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Globe, Wifi, Eye, LogIn, UserPlus, BarChart3, TrendingUp, Menu } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";
import type {
  TrackingSummary,
  LoginLogEntry,
  AccessLogEntry,
  PageViewRanking,
  IPActivitySummary,
  DailyTrend,
  SignupEntry,
  MenuUsageItem,
} from "@/app/actions/admin/tracking";

interface TrackingDashboardProps {
  summary: TrackingSummary;
  loginLogs: LoginLogEntry[];
  accessLogs: AccessLogEntry[];
  pageRanking: PageViewRanking[];
  ipActivity: IPActivitySummary[];
  dailyTrends: DailyTrend[];
  recentSignups: SignupEntry[];
  menuUsage: MenuUsageItem[];
}

function shortenUA(ua: string | null): string {
  if (!ua) return "-";
  if (ua.length <= 40) return ua;
  const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\/\s][\d.]+/);
  if (match) return match[0];
  return ua.slice(0, 40) + "...";
}

function providerBadgeVariant(provider: string | null): "default" | "secondary" | "outline" {
  switch (provider) {
    case "kakao": return "default";
    case "google": return "secondary";
    default: return "outline";
  }
}

export function TrackingDashboard({
  summary,
  loginLogs,
  accessLogs,
  pageRanking,
  ipActivity,
  dailyTrends,
  recentSignups,
  menuUsage,
}: TrackingDashboardProps) {
  const { t } = useTranslation();
  const [selectedIP, setSelectedIP] = useState<string | null>(null);

  const filteredAccessLogs = selectedIP
    ? accessLogs.filter((l) => l.ip_address === selectedIP)
    : accessLogs;

  const filteredLoginLogs = selectedIP
    ? loginLogs.filter((l) => l.ip_address === selectedIP)
    : loginLogs;

  const maxPageViews = pageRanking.length > 0 ? pageRanking[0].count : 1;
  const maxMenuViews = menuUsage.length > 0 ? menuUsage[0].totalViews : 1;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("admin.tracking.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("admin.tracking.subtitle")}
          <span className="ml-2 text-xs text-muted-foreground/70">
            (관리자 접속 제외)
          </span>
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <AdminStatsCard
          title={t("admin.tracking.uniqueVisitors")}
          value={summary.uniqueVisitors.toLocaleString()}
          description={t("admin.tracking.uniqueVisitorsDesc")}
          icon={Globe}
          colorClassName="border-l-cyan-500"
          iconColorClassName="bg-cyan-500/10 text-cyan-600"
        />
        <AdminStatsCard
          title={t("admin.tracking.activeIPs")}
          value={summary.activeIPs.toLocaleString()}
          description={t("admin.tracking.activeIPsDesc")}
          icon={Wifi}
          colorClassName="border-l-blue-500"
          iconColorClassName="bg-blue-500/10 text-blue-600"
        />
        <AdminStatsCard
          title={t("admin.tracking.pageViews")}
          value={summary.pageViews.toLocaleString()}
          description={t("admin.tracking.pageViewsDesc")}
          icon={Eye}
          colorClassName="border-l-green-500"
          iconColorClassName="bg-green-500/10 text-green-600"
        />
        <AdminStatsCard
          title={t("admin.tracking.loginAttempts")}
          value={summary.loginAttempts.toLocaleString()}
          description={t("admin.tracking.loginAttemptsDesc")}
          icon={LogIn}
          colorClassName="border-l-purple-500"
          iconColorClassName="bg-purple-500/10 text-purple-600"
        />
        <AdminStatsCard
          title="오늘 신규 가입"
          value={summary.newSignups.toLocaleString()}
          description="오늘 가입한 신규 사용자"
          icon={UserPlus}
          colorClassName="border-l-orange-500"
          iconColorClassName="bg-orange-500/10 text-orange-600"
        />
      </div>

      {/* Daily Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            일별 트렌드 (최근 14일)
          </CardTitle>
          <CardDescription>일별 방문자, 페이지뷰, 로그인, 신규 가입 추이</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.tracking.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">날짜</TableHead>
                    <TableHead className="text-xs text-right">방문자</TableHead>
                    <TableHead className="text-xs text-right">페이지뷰</TableHead>
                    <TableHead className="text-xs text-right">로그인</TableHead>
                    <TableHead className="text-xs text-right">신규 가입</TableHead>
                    <TableHead className="text-xs w-48">활동량</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...dailyTrends].reverse().map((day) => {
                    const maxPV = Math.max(...dailyTrends.map((d) => d.pageViews), 1);
                    return (
                      <TableRow key={day.date}>
                        <TableCell className="text-sm font-mono whitespace-nowrap">
                          {format(new Date(day.date + "T00:00:00"), "MM/dd (EEE)", { locale: ko })}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold">
                          {day.visitors}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {day.pageViews}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {day.logins}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {day.signups > 0 ? (
                            <Badge variant="default" className="text-xs">
                              +{day.signups}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-cyan-500 h-2 rounded-full transition-all"
                              style={{ width: `${(day.pageViews / maxPV) * 100}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Menu Usage Analysis + Recent Signups (side by side) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Menu Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="h-5 w-5" />
              메뉴 사용 분석
            </CardTitle>
            <CardDescription>최근 7일간 사용자별 메뉴 이용 현황 (관리자 제외)</CardDescription>
          </CardHeader>
          <CardContent>
            {menuUsage.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("admin.tracking.noData")}</p>
            ) : (
              <div className="space-y-3">
                {menuUsage.map((item, i) => (
                  <div key={item.menu} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 text-right font-mono">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                          {item.uniqueUsers}명 / {item.totalViews}회
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-purple-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${(item.totalViews / maxMenuViews) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              최근 가입자
            </CardTitle>
            <CardDescription>최근 30일 신규 가입 사용자 목록</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSignups.length === 0 ? (
              <p className="text-sm text-muted-foreground">최근 가입자가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">이름</TableHead>
                      <TableHead className="text-xs">가입 경로</TableHead>
                      <TableHead className="text-xs">약관</TableHead>
                      <TableHead className="text-xs">가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSignups.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="text-sm">
                          <div>
                            <span className="font-medium">{user.name}</span>
                            {user.email && (
                              <span className="text-xs text-muted-foreground block">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={providerBadgeVariant(user.provider)}
                            className="text-xs"
                          >
                            {user.provider ?? "알 수 없음"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.terms_agreed ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {user.terms_agreed ? "완료" : "미동의"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true,
                            locale: ko,
                          })}
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

      {/* Page View Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("admin.tracking.pageRankingTitle")}
          </CardTitle>
          <CardDescription>{t("admin.tracking.pageRankingDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {pageRanking.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.tracking.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-xs">#</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.path")}</TableHead>
                    <TableHead className="text-xs text-right w-24">{t("admin.tracking.views")}</TableHead>
                    <TableHead className="text-xs w-48"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRanking.map((item, i) => (
                    <TableRow key={item.path}>
                      <TableCell className="font-medium text-sm">{i + 1}</TableCell>
                      <TableCell className="text-sm font-mono">{item.path}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">
                        {item.count.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${(item.count / maxPageViews) * 100}%` }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Activity Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("admin.tracking.ipActivityTitle")}</CardTitle>
              <CardDescription>{t("admin.tracking.ipActivityDesc")}</CardDescription>
            </div>
            {selectedIP && (
              <button
                onClick={() => setSelectedIP(null)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                {t("admin.tracking.clearFilter")}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {ipActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.tracking.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">IP</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.tracking.views")}</TableHead>
                    <TableHead className="text-xs text-right">{t("admin.tracking.logins")}</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.lastAccess")}</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.users")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipActivity.map((item) => (
                    <TableRow
                      key={item.ip_address}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedIP === item.ip_address ? "bg-cyan-500/10" : ""}`}
                      onClick={() =>
                        setSelectedIP(
                          selectedIP === item.ip_address ? null : item.ip_address
                        )
                      }
                    >
                      <TableCell className="text-sm font-mono">
                        {item.ip_address}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold">
                        {item.pageViews.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {item.loginAttempts}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.lastAccess
                          ? formatDistanceToNow(new Date(item.lastAccess), {
                              addSuffix: true,
                              locale: ko,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.userNames.length > 0
                          ? item.userNames.join(", ")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login Logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.tracking.loginLogsTitle")}
            {selectedIP && (
              <Badge variant="outline" className="ml-2 text-xs">
                IP: {selectedIP}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>{t("admin.tracking.loginLogsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLoginLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.tracking.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("admin.tracking.time")}</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.userEmail")}</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                    <TableHead className="text-xs">Provider</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.result")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoginLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          {log.user_name && (
                            <span className="font-medium">{log.user_name}</span>
                          )}
                          {log.email && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {log.email}
                            </span>
                          )}
                          {!log.user_name && !log.email && "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.ip_address ?? "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={providerBadgeVariant(log.provider)} className="text-xs">
                          {log.provider ?? "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.success ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {log.success
                            ? t("admin.tracking.success")
                            : t("admin.tracking.failure")}
                        </Badge>
                        {log.error_message && (
                          <span className="text-xs text-red-500 ml-1">
                            {log.error_message}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Logs */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.tracking.accessLogsTitle")}
            {selectedIP && (
              <Badge variant="outline" className="ml-2 text-xs">
                IP: {selectedIP}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>{t("admin.tracking.accessLogsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAccessLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("admin.tracking.noData")}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t("admin.tracking.time")}</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.path")}</TableHead>
                    <TableHead className="text-xs">IP</TableHead>
                    <TableHead className="text-xs">{t("admin.tracking.userName")}</TableHead>
                    <TableHead className="text-xs">UA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{log.path}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.ip_address ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.user_name ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {shortenUA(log.user_agent)}
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
