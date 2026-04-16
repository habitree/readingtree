"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, Trash2, Search, ChevronLeft, ChevronRight, BookOpen, Link2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getBookRelationsList, adminDeleteBookRelation } from "@/app/actions/admin";
import { getImageUrl } from "@/lib/utils/image";
import { formatDistanceToNow, format } from "date-fns";
import { ko } from "date-fns/locale";
import type { RelationEntry } from "@/app/actions/admin/book-relations";

interface BookRelationsTableProps {
  initialData: { relations: RelationEntry[]; total: number };
  selectedUserId?: string;
}

export function BookRelationsTable({
  initialData,
  selectedUserId,
}: BookRelationsTableProps) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pageSize = 20;
  const totalPages = Math.ceil(data.total / pageSize);

  const loadPage = async (newPage: number) => {
    setIsLoading(true);
    try {
      const result = await getBookRelationsList(newPage, pageSize, selectedUserId);
      setData(result);
      setPage(newPage);
    } catch (error) {
      console.error("페이지 로드 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (relation: RelationEntry) => {
    setDeletingId(relation.id);
    try {
      await adminDeleteBookRelation(
        relation.sourceUserBookId,
        relation.targetUserBookId,
        relation.userId
      );
      toast.success("연결이 삭제되었습니다");
      await loadPage(page);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "삭제에 실패했습니다");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRelations = searchQuery.trim()
    ? data.relations.filter(
        (r) =>
          r.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.targetTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data.relations;

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
      {/* 헤더 */}
      <CardHeader className="pb-4 bg-white/90 dark:bg-[#0e0c1d]/90 backdrop-blur-sm border-b border-border/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-indigo-500" />
            <CardTitle className="text-base tracking-tight">연결 목록</CardTitle>
            {data.total > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-full">
                {data.total}
              </span>
            )}
          </div>
          {/* Command 스타일 검색 */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              type="search"
              placeholder="제목, 저자 또는 사용자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-12 h-9 text-[13px] bg-muted/30 dark:bg-white/[0.03] border-border/30 focus:bg-white dark:focus:bg-[#0e0c1d] transition-colors"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 border border-border/30 rounded px-1.5 py-0.5 font-mono hidden sm:inline">
              /
            </kbd>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {data.relations.length === 0 ? (
          /* 빈 상태 */
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border/40 flex items-center justify-center mb-4">
              <BookOpen className="h-7 w-7 opacity-30" />
            </div>
            <p className="text-sm font-medium">연결 데이터가 없습니다</p>
            <p className="text-xs mt-1 opacity-50">책 상세 페이지에서 연결을 추가해보세요</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 dark:bg-white/[0.02] hover:bg-muted/30">
                    <TableHead className="min-w-[200px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 h-10">출발 책</TableHead>
                    <TableHead className="w-[40px] text-center" />
                    <TableHead className="min-w-[200px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 h-10">도착 책</TableHead>
                    <TableHead className="min-w-[100px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 h-10">사용자</TableHead>
                    <TableHead className="min-w-[110px] text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/70 h-10">생성일</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // 스켈레톤 로딩
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        <TableCell><div className="flex items-center gap-3"><div className="w-10 h-14 rounded-lg bg-muted animate-pulse" /><div className="space-y-1.5"><div className="h-3.5 w-24 rounded bg-muted animate-pulse" /><div className="h-2.5 w-16 rounded bg-muted animate-pulse" /></div></div></TableCell>
                        <TableCell />
                        <TableCell><div className="flex items-center gap-3"><div className="w-10 h-14 rounded-lg bg-muted animate-pulse" /><div className="space-y-1.5"><div className="h-3.5 w-20 rounded bg-muted animate-pulse" /><div className="h-2.5 w-14 rounded bg-muted animate-pulse" /></div></div></TableCell>
                        <TableCell><div className="h-3 w-16 rounded bg-muted animate-pulse" /></TableCell>
                        <TableCell><div className="h-3 w-14 rounded bg-muted animate-pulse" /></TableCell>
                        <TableCell />
                      </TableRow>
                    ))
                  ) : filteredRelations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-sm text-muted-foreground/60">
                        검색 결과가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TooltipProvider delayDuration={300}>
                      {filteredRelations.map((relation, idx) => (
                        <motion.tr
                          key={relation.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group border-b border-border/30 last:border-0 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 transition-colors relative"
                        >
                          {/* 좌측 accent 보더 (호버 시) */}
                          <td className="relative py-3 px-4">
                            <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BookCellPremium
                              title={relation.sourceTitle}
                              author={relation.sourceAuthor}
                              coverUrl={relation.sourceCoverUrl}
                            />
                          </td>
                          <td className="py-3 px-1 text-center">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                          </td>
                          <td className="py-3 px-4">
                            <BookCellPremium
                              title={relation.targetTitle}
                              author={relation.targetAuthor}
                              coverUrl={relation.targetCoverUrl}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[13px] text-foreground/80">
                              {relation.userName || "알 수 없음"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-[13px] text-muted-foreground/70 cursor-default">
                                  {formatDistanceToNow(new Date(relation.createdAt), { addSuffix: true, locale: ko })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {format(new Date(relation.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                          <td className="py-3 px-3">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === relation.id}
                                >
                                  {deletingId === relation.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-base">연결 삭제</AlertDialogTitle>
                                  <AlertDialogDescription className="text-[13px]">
                                    <span className="font-medium text-foreground">{relation.sourceTitle}</span>
                                    {" "}와{" "}
                                    <span className="font-medium text-foreground">{relation.targetTitle}</span>
                                    의 연결을 삭제하시겠습니까?
                                    <br />
                                    <span className="text-muted-foreground/60 text-xs mt-1 block">양방향 연결이 모두 삭제됩니다.</span>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-[13px]">취소</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(relation)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-[13px]"
                                  >
                                    삭제
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </motion.tr>
                      ))}
                    </TooltipProvider>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/20 bg-muted/20 dark:bg-white/[0.01]">
                <p className="text-[12px] tabular-nums text-muted-foreground/60">
                  {data.total}개 중 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => loadPage(page - 1)}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground/40">...</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "ghost"}
                        size="icon"
                        className={`h-8 w-8 text-xs tabular-nums ${p === page ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" : ""}`}
                        onClick={() => loadPage(p as number)}
                        disabled={isLoading}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => loadPage(page + 1)}
                    disabled={page >= totalPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function BookCellPremium({
  title,
  author,
  coverUrl,
}: {
  title: string;
  author: string | null;
  coverUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-10 h-14 shrink-0 rounded-lg overflow-hidden bg-muted/50 ring-1 ring-black/[0.04] dark:ring-white/[0.06] group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800/40 transition-all group-hover:shadow-md">
        {coverUrl ? (
          <Image
            src={getImageUrl(coverUrl)}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="40px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <BookOpen className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-medium truncate max-w-[160px] text-foreground/90">{title}</p>
        {author && (
          <p className="text-[11px] text-muted-foreground/60 truncate max-w-[160px] mt-0.5">{author}</p>
        )}
      </div>
    </div>
  );
}
