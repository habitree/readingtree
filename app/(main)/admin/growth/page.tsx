import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCachedCurrentUser } from "@/lib/cached";
import {
  getGrowthSummary,
  getShareMetrics,
  getReferralMetrics,
  getSubscriptionFunnel,
  getPointFlow,
} from "@/app/actions/admin/growth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GrowthChannelTable } from "@/components/admin/growth-channel-table";
import { PointFlowChart } from "@/components/admin/point-flow-chart";

export const metadata: Metadata = {
  title: "성장 지표 | 관리자",
};

export const dynamic = "force-dynamic";

function formatPercent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

export default async function AdminGrowthPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  try {
    const [summary, shareMetrics, referral, subscription, pointFlow] = await Promise.all([
      getGrowthSummary(),
      getShareMetrics(),
      getReferralMetrics(),
      getSubscriptionFunnel(),
      getPointFlow(),
    ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">성장 지표</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            바이럴·전환·포인트 흐름 요약. 관리자 접속은 통계에서 제외됩니다.
          </p>
        </div>

        {/* KPI 카드 그리드 */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="DAU" value={summary.dau} hint="오늘 (KST 00:00~)" />
          <StatCard label="WAU" value={summary.wau} hint="최근 7일" />
          <StatCard label="MAU" value={summary.mau} hint="최근 30일" />
          <StatCard
            label="신규 가입"
            value={summary.newSignupsToday}
            hint={`최근 7일: ${summary.newSignups7d.toLocaleString()}`}
          />
        </div>

        {/* 공유 + 레퍼럴 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">공유 이벤트 (30일)</CardTitle>
              <CardDescription>
                전체 {shareMetrics.total.toLocaleString()}건
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <GrowthChannelTable
                caption="채널별"
                rows={shareMetrics.byChannel}
                total={shareMetrics.total}
                labelKey="channel"
              />
              <GrowthChannelTable
                caption="공유 유형별"
                rows={shareMetrics.byKind}
                total={shareMetrics.total}
                labelKey="channel"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">레퍼럴</CardTitle>
              <CardDescription>바이럴 계수 추정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="전체" value={referral.total} />
                <MiniStat label="대기" value={referral.pending} />
                <MiniStat label="완료" value={referral.completed} />
                <MiniStat label="이번 달" value={referral.monthly} />
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">전환율</p>
                <p className="mt-0.5 text-2xl font-bold">
                  {formatPercent(referral.conversionRate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 구독 퍼널 + 포인트 흐름 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">구독 퍼널</CardTitle>
              <CardDescription>활성 구독자 / 전체 사용자</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="전체 사용자" value={subscription.totalUsers} />
                <MiniStat label="활성 구독자" value={subscription.activeSubscribers} />
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">전환율</p>
                <p className="mt-0.5 text-2xl font-bold">
                  {formatPercent(subscription.conversionRate)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">포인트 흐름 (7일)</CardTitle>
              <CardDescription>일별 적립 / 차감</CardDescription>
            </CardHeader>
            <CardContent>
              <PointFlowChart data={pointFlow} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        <p className="font-semibold">지표를 불러올 수 없어요</p>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    );
  }
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-3xl font-bold">{value.toLocaleString()}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
