"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, LogIn, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import { getMemberAccessHistory } from "@/app/actions/admin";
import type { MemberAccessHistory } from "@/app/actions/admin/tracking";
import { PathLabel } from "./path-label";

interface MemberAccessDialogProps {
  member: { id: string; name: string; email: string | null } | null;
  onOpenChange: (open: boolean) => void;
}

interface FetchResult {
  memberId: string;
  data: MemberAccessHistory | null; // null = 조회 실패
}

export function MemberAccessDialog({ member, onOpenChange }: MemberAccessDialogProps) {
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    getMemberAccessHistory(member.id)
      .then((data) => {
        if (!cancelled) setResult({ memberId: member.id, data });
      })
      .catch(() => {
        if (!cancelled) setResult({ memberId: member.id, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [member]);

  const loaded = member && result?.memberId === member.id ? result : null;
  const history = loaded?.data ?? null;
  const loading = !!member && !loaded;

  return (
    <Dialog open={!!member} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member?.name} 접속기록</DialogTitle>
          <DialogDescription>
            {member?.email ?? "-"} · 최근 로그인 50건 / 페이지 접속 100건
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-sm">접속기록을 불러오는 중...</span>
          </div>
        ) : history ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid gap-3 grid-cols-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Eye className="h-3.5 w-3.5" />
                  총 페이지뷰
                </div>
                <div className="text-xl font-bold">
                  {history.summary.totalPageViews.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <LogIn className="h-3.5 w-3.5" />
                  로그인 횟수
                </div>
                <div className="text-xl font-bold">
                  {history.summary.totalLogins.toLocaleString()}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  마지막 접속
                </div>
                <div className="text-sm font-bold">
                  {history.summary.lastAccessAt
                    ? formatDistanceToNow(new Date(history.summary.lastAccessAt), {
                        addSuffix: true,
                        locale: ko,
                      })
                    : "-"}
                </div>
              </div>
            </div>

            {/* Access Logs */}
            <div>
              <h3 className="text-sm font-semibold mb-2">페이지 접속 기록</h3>
              {history.accessLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">접속 기록이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">시간</TableHead>
                        <TableHead className="text-xs">메뉴</TableHead>
                        <TableHead className="text-xs">IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.accessLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), "MM/dd HH:mm", { locale: ko })}
                          </TableCell>
                          <TableCell>
                            <PathLabel path={log.path} />
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.ip_address ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Login Logs */}
            <div>
              <h3 className="text-sm font-semibold mb-2">로그인 기록</h3>
              {history.loginLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">로그인 기록이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">시간</TableHead>
                        <TableHead className="text-xs">Provider</TableHead>
                        <TableHead className="text-xs">IP</TableHead>
                        <TableHead className="text-xs">결과</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.loginLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.created_at), "MM/dd HH:mm", { locale: ko })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {log.provider ?? "unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.ip_address ?? "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={log.success ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {log.success ? "성공" : "실패"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            접속기록을 불러오지 못했습니다.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
