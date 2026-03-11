"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Users, Search, BookOpen, FileText, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import type { MemberEntry } from "@/app/actions/admin/stats";

interface MembersListProps {
  members: MemberEntry[];
}

function providerLabel(provider: string | null): string {
  switch (provider) {
    case "kakao": return "카카오";
    case "google": return "구글";
    case "email": return "이메일";
    default: return "-";
  }
}

function providerVariant(provider: string | null): "default" | "secondary" | "outline" {
  switch (provider) {
    case "kakao": return "default";
    case "google": return "secondary";
    default: return "outline";
  }
}

export function MembersList({ members }: MembersListProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"created_at" | "bookCount" | "noteCount" | "lastLoginAt">("created_at");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = members;

    if (q) {
      result = members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.email?.toLowerCase().includes(q) ?? false)
      );
    }

    return [...result].sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;

      switch (sortKey) {
        case "created_at":
          av = a.created_at;
          bv = b.created_at;
          break;
        case "bookCount":
          av = a.bookCount;
          bv = b.bookCount;
          break;
        case "noteCount":
          av = a.noteCount;
          bv = b.noteCount;
          break;
        case "lastLoginAt":
          av = a.lastLoginAt ?? "";
          bv = b.lastLoginAt ?? "";
          break;
      }

      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [members, search, sortKey, sortAsc]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sortIndicator = (key: typeof sortKey) =>
    sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  const realMembers = members.filter((m) => !m.is_admin);
  const activeMembers = realMembers.filter((m) => m.terms_agreed);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 회원</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realMembers.length}</div>
            <p className="text-xs text-muted-foreground">관리자 제외</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">약관 동의 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              활성 비율 {realMembers.length > 0 ? Math.round((activeMembers.length / realMembers.length) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">약관 미동의</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realMembers.length - activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">온보딩 미완료 사용자</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름 또는 이메일로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            회원 목록 ({filtered.length}명)
          </CardTitle>
          <CardDescription>전체 가입 회원 현황 (데모 계정 제외)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-10">#</TableHead>
                  <TableHead className="text-xs">회원 정보</TableHead>
                  <TableHead className="text-xs">가입 경로</TableHead>
                  <TableHead className="text-xs">상태</TableHead>
                  <TableHead
                    className="text-xs text-right cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("bookCount")}
                  >
                    도서{sortIndicator("bookCount")}
                  </TableHead>
                  <TableHead
                    className="text-xs text-right cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("noteCount")}
                  >
                    노트{sortIndicator("noteCount")}
                  </TableHead>
                  <TableHead
                    className="text-xs cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("lastLoginAt")}
                  >
                    마지막 로그인{sortIndicator("lastLoginAt")}
                  </TableHead>
                  <TableHead
                    className="text-xs cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("created_at")}
                  >
                    가입일{sortIndicator("created_at")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {search ? "검색 결과가 없습니다." : "회원이 없습니다."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((member, i) => (
                    <TableRow key={member.id}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {member.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{member.name}</span>
                              {member.is_admin && (
                                <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate block max-w-[200px]">
                              {member.email ?? "-"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={providerVariant(member.loginProvider)} className="text-xs">
                          {providerLabel(member.loginProvider)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.terms_agreed ? (
                          <Badge variant="default" className="text-xs">활성</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">미동의</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        <span className="inline-flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          {member.bookCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          {member.noteCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {member.lastLoginAt
                          ? formatDistanceToNow(new Date(member.lastLoginAt), {
                              addSuffix: true,
                              locale: ko,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(member.created_at), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
