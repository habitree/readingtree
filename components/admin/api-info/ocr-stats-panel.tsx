"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiIntegrationInfoProps } from "./types";

type OcrStatsPanelProps = Pick<
  ApiIntegrationInfoProps,
  "ocrConnectionTest" | "ocrTotalStats" | "ocrMonthlyUsage" | "transcriptionStats"
>;

export function OcrStatsPanel({
  ocrConnectionTest,
  ocrTotalStats,
  ocrMonthlyUsage,
  transcriptionStats,
}: OcrStatsPanelProps) {
  const hasAnyData =
    ocrConnectionTest || ocrTotalStats || ocrMonthlyUsage || transcriptionStats;

  if (!hasAnyData) return null;

  return (
    <div className="space-y-3">
      {/* 실시간 연결 테스트 */}
      {ocrConnectionTest && (
        <Card
          variant="glass"
          className={cn(
            "overflow-hidden",
            ocrConnectionTest.overallStatus === "connected"
              ? "border-green-500/30"
              : ocrConnectionTest.overallStatus === "token_error"
                ? "border-yellow-500/30"
                : "border-red-500/30"
          )}
        >
          <div
            className={cn(
              "h-1 bg-gradient-to-r",
              ocrConnectionTest.overallStatus === "connected"
                ? "from-green-400 to-green-600"
                : ocrConnectionTest.overallStatus === "token_error"
                  ? "from-yellow-400 to-yellow-600"
                  : "from-red-400 to-red-600"
            )}
          />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              {ocrConnectionTest.overallStatus === "connected" ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : ocrConnectionTest.overallStatus === "token_error" ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-medium">실시간 연결 테스트</span>
              <Badge
                variant={
                  ocrConnectionTest.overallStatus === "connected"
                    ? "default"
                    : "destructive"
                }
                className="text-[10px]"
              >
                {ocrConnectionTest.overallStatus === "connected"
                  ? "연결됨"
                  : ocrConnectionTest.overallStatus === "token_error"
                    ? "토큰 오류"
                    : "연결 실패"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">토큰 생성</div>
                <div className="flex items-center gap-1">
                  {ocrConnectionTest.tokenGeneration.success ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>
                    {ocrConnectionTest.tokenGeneration.method === "dynamic"
                      ? "동적 토큰"
                      : ocrConnectionTest.tokenGeneration.method === "static"
                        ? "정적 토큰"
                        : "인증 없음"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">API 연결</div>
                <div className="flex items-center gap-1">
                  {ocrConnectionTest.apiConnection.success ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span>
                    {ocrConnectionTest.apiConnection.success
                      ? `${ocrConnectionTest.apiConnection.latencyMs}ms`
                      : `오류 (${ocrConnectionTest.apiConnection.statusCode})`}
                  </span>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-muted-foreground mb-0.5">상세 메시지</div>
                <div className="font-mono bg-background/50 p-2 rounded text-[11px]">
                  {ocrConnectionTest.apiConnection.message ||
                    ocrConnectionTest.tokenGeneration.message}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription 처리 현황 */}
      {transcriptionStats && (
        <Card variant="glass" className="overflow-hidden border-purple-500/20">
          <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">OCR 처리 현황</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">전체 이미지</div>
                <div className="text-lg font-bold">
                  {transcriptionStats.totalImageNotes.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">처리 완료</div>
                <div className="text-lg font-bold text-green-600">
                  {transcriptionStats.completed.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">처리 대기</div>
                <div className="text-lg font-bold text-yellow-600">
                  {transcriptionStats.needingOcr.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">실패</div>
                <div className="text-lg font-bold text-red-600">
                  {transcriptionStats.failed.toLocaleString()}
                </div>
              </div>
            </div>
            {/* 진행률 바 */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-500/20">
              <span className="text-muted-foreground">처리 완료율</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                    style={{ width: `${transcriptionStats.completionRate}%` }}
                  />
                </div>
                <span className="font-bold text-purple-600">
                  {transcriptionStats.completionRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 실제 사용량 통계 */}
      {ocrTotalStats && (
        <Card variant="glass" className="overflow-hidden border-blue-500/20">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-medium">실제 사용량 통계</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">전체 처리</div>
                <div className="text-lg font-bold">
                  {ocrTotalStats.total.toLocaleString()}건
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">이번 달</div>
                <div className="text-lg font-bold text-blue-600">
                  {ocrTotalStats.thisMonth.toLocaleString()}건
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">성공률</div>
                <div className="text-lg font-bold text-green-600">
                  {ocrTotalStats.successRate}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">성공/실패</div>
                <div>
                  <span className="text-green-600 font-medium">
                    {ocrTotalStats.success.toLocaleString()}
                  </span>
                  {" / "}
                  <span className="text-red-600 font-medium">
                    {ocrTotalStats.failure.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 월별 사용량 차트 */}
      {ocrMonthlyUsage && ocrMonthlyUsage.length > 0 && (
        <Card variant="glass" className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="text-sm font-medium">
              월별 사용량 추이 (최근 {ocrMonthlyUsage.length}개월)
            </div>
            <div className="h-[180px] flex items-end justify-between gap-1.5">
              {ocrMonthlyUsage.map((item, i) => {
                const maxUsage = Math.max(
                  ...ocrMonthlyUsage.map((m) => m.total),
                  1
                );
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500/40 to-blue-400/20 hover:from-blue-500/60 hover:to-blue-400/40 transition-all rounded-t-md relative border border-blue-500/20"
                      style={{
                        height: `${Math.max((item.total / maxUsage) * 140, 8)}px`,
                      }}
                    >
                      <span className="absolute -top-14 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background px-2 py-1 rounded border shadow-sm z-10">
                        {item.month}: {item.total}건
                        <br />
                        성공 {item.success} / 실패 {item.failure}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
