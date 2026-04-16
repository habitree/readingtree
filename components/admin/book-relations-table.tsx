"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Loader2, Trash2, Search, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { getBookRelationsList, adminDeleteBookRelation } from "@/app/actions/admin";
import { getImageUrl } from "@/lib/utils/image";
import { formatDistanceToNow } from "date-fns";
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
      // 현재 페이지 다시 로드
      await loadPage(page);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "삭제에 실패했습니다"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // 로컬 검색 필터링
  const filteredRelations = searchQuery.trim()
    ? data.relations.filter(
        (r) =>
          r.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.targetTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data.relations;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">연결 목록</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="책 제목 또는 사용자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.relations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">연결 데이터가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">출발 책</TableHead>
                    <TableHead className="min-w-[180px]">도착 책</TableHead>
                    <TableHead className="min-w-[100px]">사용자</TableHead>
                    <TableHead className="min-w-[100px]">생성일</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredRelations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        검색 결과가 없습니다
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRelations.map((relation) => (
                      <TableRow key={relation.id}>
                        <TableCell>
                          <BookCell
                            title={relation.sourceTitle}
                            author={relation.sourceAuthor}
                            coverUrl={relation.sourceCoverUrl}
                          />
                        </TableCell>
                        <TableCell>
                          <BookCell
                            title={relation.targetTitle}
                            author={relation.targetAuthor}
                            coverUrl={relation.targetCoverUrl}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {relation.userName || "알 수 없음"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(relation.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                disabled={deletingId === relation.id}
                              >
                                {deletingId === relation.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>연결 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  &ldquo;{relation.sourceTitle}&rdquo;와
                                  &ldquo;{relation.targetTitle}&rdquo;의 연결을
                                  삭제하시겠습니까? 양방향 연결이 모두
                                  삭제됩니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(relation)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  총 {data.total}개 중 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, data.total)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadPage(page - 1)}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
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

function BookCell({
  title,
  author,
  coverUrl,
}: {
  title: string;
  author: string | null;
  coverUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-11 shrink-0 rounded overflow-hidden bg-muted">
        {coverUrl ? (
          <Image
            src={getImageUrl(coverUrl)}
            alt={title}
            fill
            className="object-cover"
            sizes="32px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate max-w-[150px]">{title}</p>
        {author && (
          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
            {author}
          </p>
        )}
      </div>
    </div>
  );
}
