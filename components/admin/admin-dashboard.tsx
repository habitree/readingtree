"use server";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { AdminStatsCard } from "./admin-stats-card";
import { BatchOCRButton } from "./batch-ocr-button";
import { Users, BookOpen, FileText, LayoutGrid, Clock, UserPlus, Settings, Zap, TrendingUp, ScanLine, CheckCircle2, XCircle, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AdminDashboardProps {
    stats: any;
    growth: any;
    activity: any;
    ocrMonthlyUsage: Array<{
        month: string;
        year: number;
        fullDate: string;
        total: number;
        success: number;
        failure: number;
    }>;
    ocrTotalStats: {
        total: number;
        success: number;
        failure: number;
        thisMonth: number;
        successRate: number;
    };
}

export async function AdminDashboard({ stats, growth, activity, ocrMonthlyUsage, ocrTotalStats }: AdminDashboardProps) {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">시스템 대시보드_</h1>
                    <p className="text-muted-foreground">ReadingTree 플랫폼의 전체 현황 및 활동 집계</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <BatchOCRButton />
                    <Link
                        href="/admin/ai-settings"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                        <Bot className="h-4 w-4" />
                        AI 설정
                    </Link>
                    <Link
                        href="/admin/api-info"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                    >
                        <Settings className="h-4 w-4" />
                        API 연동 정보
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="전체 사용자"
                    value={stats.summary.users.toLocaleString()}
                    description="총 가입 계정 수"
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                    colorClassName="border-l-blue-500"
                    iconColorClassName="bg-blue-500/10 text-blue-600"
                />
                <AdminStatsCard
                    title="등록된 도서"
                    value={stats.summary.books.toLocaleString()}
                    description="시스템 등록 도서 총합"
                    icon={BookOpen}
                    colorClassName="border-l-forest-500"
                    iconColorClassName="bg-forest-500/10 text-forest-600"
                />
                <AdminStatsCard
                    title="전체 기록"
                    value={stats.summary.notes.toLocaleString()}
                    description="전체 사용자의 독서 노트"
                    icon={FileText}
                    trend={{ value: 8, isPositive: true }}
                    colorClassName="border-l-purple-500"
                    iconColorClassName="bg-purple-500/10 text-purple-600"
                />
                <AdminStatsCard
                    title="활성 그룹"
                    value={stats.summary.groups.toLocaleString()}
                    description="운영 중인 독서 그룹"
                    icon={LayoutGrid}
                    colorClassName="border-l-orange-500"
                    iconColorClassName="bg-orange-500/10 text-orange-600"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Growth Statistics - Conceptual Placeholder or reuse MonthlyChart if possible */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>성장 추이</CardTitle>
                        <CardDescription>최근 6개월간 신규 사용자 가입 현황</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-between gap-2 px-6 pb-8">
                        {growth.map((item: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div
                                    className="w-full bg-primary/20 hover:bg-primary/40 transition-all rounded-t-md relative flex items-end justify-center"
                                    style={{ height: `${Math.max((item.count / (Math.max(...growth.map((g: any) => g.count)) || 1)) * 200, 10)}px` }}
                                >
                                    <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.count}
                                    </span>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent New Users */}
                <Card className="col-span-3">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-500" />
                            <CardTitle>신규 가입자</CardTitle>
                        </div>
                        <CardDescription>가장 최근에 가입한 5명의 사용자</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {activity.recentUsers.map((user: any) => (
                                <div key={user.id} className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar_url || ""} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-mono">
                                        {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ko })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* OCR Usage Statistics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            <CardTitle>OCR API 사용량</CardTitle>
                        </div>
                        <CardDescription>월별 OCR 처리 현황 (최근 6개월)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-between gap-2 px-6 pb-8">
                        {ocrMonthlyUsage.map((item, i) => {
                            const maxUsage = Math.max(...ocrMonthlyUsage.map(m => m.total), 1);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full flex flex-col items-center gap-1">
                                        <div
                                            className="w-full bg-yellow-500/30 hover:bg-yellow-500/50 transition-all rounded-t-md relative flex items-end justify-center border border-yellow-500/20"
                                            style={{ height: `${Math.max((item.total / maxUsage) * 200, 10)}px` }}
                                        >
                                            <span className="absolute -top-8 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background px-2 py-1 rounded border shadow-sm">
                                                총 {item.total}건<br />
                                                성공 {item.success}건<br />
                                                실패 {item.failure}건
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <CardTitle>OCR 통계 요약</CardTitle>
                        </div>
                        <CardDescription>전체 OCR 처리 통계 및 성공률</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <span className="text-sm font-medium">전체 처리 횟수</span>
                                <span className="text-2xl font-bold">{ocrTotalStats.total.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                                <span className="text-sm font-medium">성공 횟수</span>
                                <span className="text-2xl font-bold text-green-600">{ocrTotalStats.success.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <span className="text-sm font-medium">실패 횟수</span>
                                <span className="text-2xl font-bold text-red-600">{ocrTotalStats.failure.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-sm font-medium">이번 달 사용량</span>
                                <span className="text-2xl font-bold text-blue-600">{ocrTotalStats.thisMonth.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <span className="text-sm font-medium">성공률</span>
                                <span className="text-2xl font-bold text-purple-600">{ocrTotalStats.successRate}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* OCR API Usage Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="OCR 총 사용량"
                    value={ocrTotalStats.total.toLocaleString()}
                    description="전체 OCR 처리 횟수"
                    icon={ScanLine}
                    colorClassName="border-l-purple-500"
                    iconColorClassName="bg-purple-500/10 text-purple-600"
                />
                <AdminStatsCard
                    title="OCR 성공률"
                    value={`${ocrTotalStats.successRate}%`}
                    description={`성공: ${ocrTotalStats.success.toLocaleString()} / 실패: ${ocrTotalStats.failure.toLocaleString()}`}
                    icon={CheckCircle2}
                    colorClassName="border-l-green-500"
                    iconColorClassName="bg-green-500/10 text-green-600"
                    trend={{
                        value: ocrTotalStats.successRate,
                        isPositive: ocrTotalStats.successRate >= 90
                    }}
                />
                <AdminStatsCard
                    title="이번 달 사용량"
                    value={ocrTotalStats.thisMonth.toLocaleString()}
                    description="현재 월 OCR 처리 횟수"
                    icon={Zap}
                    colorClassName="border-l-orange-500"
                    iconColorClassName="bg-orange-500/10 text-orange-600"
                />
                <AdminStatsCard
                    title="OCR 실패 횟수"
                    value={ocrTotalStats.failure.toLocaleString()}
                    description="전체 실패 건수"
                    icon={XCircle}
                    colorClassName="border-l-red-500"
                    iconColorClassName="bg-red-500/10 text-red-600"
                />
            </div>

            {/* OCR Monthly Usage Chart */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-500" />
                            <CardTitle>OCR 월별 사용량</CardTitle>
                        </div>
                        <CardDescription>최근 6개월간 OCR API 사용 추이</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-end justify-between gap-2 px-6 pb-8">
                        {ocrMonthlyUsage.map((item, i) => {
                            const maxTotal = Math.max(...ocrMonthlyUsage.map((m: any) => m.total), 1);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex items-end justify-center gap-0.5">
                                        {/* 성공 (녹색) */}
                                        <div
                                            className="w-full bg-green-500/80 hover:bg-green-500 transition-all rounded-t-md relative flex items-end justify-center"
                                            style={{ 
                                                height: `${Math.max((item.success / maxTotal) * 200, item.success > 0 ? 10 : 0)}px`,
                                                minHeight: item.success > 0 ? "10px" : "0px"
                                            }}
                                        >
                                            <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                성공: {item.success}
                                            </span>
                                        </div>
                                        {/* 실패 (빨간색) */}
                                        {item.failure > 0 && (
                                            <div
                                                className="w-full bg-red-500/80 hover:bg-red-500 transition-all rounded-t-md relative flex items-end justify-center"
                                                style={{ 
                                                    height: `${Math.max((item.failure / maxTotal) * 200, 10)}px`,
                                                    minHeight: "10px"
                                                }}
                                            >
                                                <span className="absolute -top-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    실패: {item.failure}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xs text-muted-foreground font-medium block">{item.month}</span>
                                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                                            총 {item.total}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* OCR Monthly Usage Table */}
                <Card className="col-span-1">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <ScanLine className="h-5 w-5 text-purple-500" />
                            <CardTitle>월별 상세 통계</CardTitle>
                        </div>
                        <CardDescription>월별 OCR 처리 상세 내역</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-xs">월</TableHead>
                                        <TableHead className="text-xs text-right">총 사용량</TableHead>
                                        <TableHead className="text-xs text-right">성공</TableHead>
                                        <TableHead className="text-xs text-right">실패</TableHead>
                                        <TableHead className="text-xs text-right">성공률</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ocrMonthlyUsage.map((item, i) => {
                                        const successRate = item.total > 0 
                                            ? Math.round((item.success / item.total) * 100) 
                                            : 0;
                                        return (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium text-sm">
                                                    {item.year}년 {item.month}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {item.total.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    {item.success.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {item.failure.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge 
                                                        variant={successRate >= 90 ? "default" : successRate >= 70 ? "secondary" : "destructive"}
                                                        className="text-xs"
                                                    >
                                                        {successRate}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* System Activity */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-purple-500" />
                        <CardTitle>최근 시스템 활동</CardTitle>
                    </div>
                    <CardDescription>시스템 전체에서 발생한 실시간 기록 활동</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {activity.recentNotes.map((note: any) => (
                            <div key={note.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                <div className={cn(
                                    "mt-1 p-2 rounded-full",
                                    note.type === 'quote' && "bg-yellow-500/10 text-yellow-600",
                                    note.type === 'photo' && "bg-blue-500/10 text-blue-600",
                                    note.type === 'memo' && "bg-forest-500/10 text-forest-600",
                                    note.type === 'transcription' && "bg-purple-500/10 text-purple-600"
                                )}>
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-sm text-foreground">{note.users?.name || "익명"}</span>
                                        <span className="text-xs text-muted-foreground">님이</span>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4">
                                            {note.books?.title || "알 수 없는 책"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 italic">
                                        {note.content || "이미지 기록"}
                                    </p>
                                </div>
                                <div className="text-[10px] text-muted-foreground shrink-0 self-center">
                                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ko })}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
