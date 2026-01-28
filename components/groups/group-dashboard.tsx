"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberList } from "./member-list";
import { SharedNotesList } from "./shared-notes-list";
import { GroupBooksManager } from "./group-books-manager";
import { SharedBooksManager } from "./shared-books-manager";
import { MemberActivityList } from "./member-activity-list";
import { joinGroup, getGroupBookNoteCounts } from "@/app/actions/groups";
import { toast } from "sonner";
import { Users, Lock, Globe, UserPlus, CheckCircle2, Clock, Activity, MessageSquare } from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GroupDashboardProps {
  groupData: {
    group: any;
    members: any[];
    myMembership: {
      role: string;
      status: string;
    } | null;
    sharedNotes: any[];
    groupBooks?: any[];
    sharedBooks?: any[];
    isLeader: boolean;
  };
}

/**
 * 모임 대시보드 컴포넌트
 * 모임 정보, 구성원, 공유 기록 표시
 */
export function GroupDashboard({ groupData }: GroupDashboardProps) {
  const router = useRouter();
  const { group, members, myMembership, sharedNotes, isLeader } = groupData;
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await joinGroup(group.id);
      toast.success(
        result.autoApproved
          ? "모임에 참여되었습니다."
          : "참여 신청이 완료되었습니다. 리더의 승인을 기다려주세요."
      );
      router.refresh();
    } catch (error) {
      console.error("모임 참여 오류:", error);
      toast.error(
        error instanceof Error ? error.message : "모임 참여에 실패했습니다."
      );
    } finally {
      setIsJoining(false);
    }
  };

  const leader = group.users;

  return (
    <div className="space-y-6">
      {/* 모임 헤더 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
            <Badge variant={group.is_public ? "default" : "secondary"}>
              {group.is_public ? (
                <>
                  <Globe className="mr-1 h-3 w-3" />
                  공개
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  비공개
                </>
              )}
            </Badge>
          </div>
          {group.description && (
            <p className="text-muted-foreground">{group.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{members.length}명</span>
            </div>
            {leader && (
              <div className="flex items-center gap-2">
                <span>리더:</span>
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={leader?.avatar_url || undefined} />
                    <AvatarFallback>
                      {leader?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{leader?.name || "알 수 없음"}</span>
                </div>
              </div>
            )}
            <span>생성일: {formatSmartDate(group.created_at)}</span>
          </div>
        </div>

        {/* 참여 버튼 */}
        {!myMembership && (
          <Button onClick={handleJoin} disabled={isJoining}>
            {isJoining ? "처리 중..." : "참여 신청"}
          </Button>
        )}
        {myMembership && myMembership.status === "pending" && (
          <Button variant="outline" disabled>
            <Clock className="mr-2 h-4 w-4" />
            승인 대기 중
          </Button>
        )}
        {myMembership && myMembership.status === "approved" && (
          <Badge variant="default">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            멤버
          </Badge>
        )}
      </div>

      {/* 대시보드 탭 */}
      {myMembership && myMembership.status === "approved" && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="members">구성원</TabsTrigger>
            <TabsTrigger value="books">지정도서</TabsTrigger>
            <TabsTrigger value="shared-library">공유 서재</TabsTrigger>
            <TabsTrigger value="notes">공유 기록</TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="mr-1 h-4 w-4" />
              멤버 활동
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>구성원</CardTitle>
                  <CardDescription>모임 멤버 수</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{members.length}명</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>공유 기록</CardTitle>
                  <CardDescription>모임에 공유된 기록 수</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sharedNotes.length}개</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>지정도서</CardTitle>
                  <CardDescription>모임 지정도서 수</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{groupData.groupBooks?.length || 0}권</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>공유 서재</CardTitle>
                  <CardDescription>모임에 공유된 서재 수</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{groupData.sharedBooks?.length || 0}권</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members">
            <MemberList members={members} isLeader={isLeader} groupId={group.id} />
          </TabsContent>

          <TabsContent value="books">
            <GroupBooksManager groupId={group.id} isLeader={isLeader} />
          </TabsContent>

          <TabsContent value="shared-library">
            <SharedBooksManager groupId={group.id} />
          </TabsContent>

          <TabsContent value="notes">
            <SharedNotesList notes={sharedNotes} />
          </TabsContent>

          <TabsContent value="activity">
            <MemberActivityList groupId={group.id} />
          </TabsContent>
        </Tabs>
      )}

      {/* 비멤버용 안내 */}
      {(!myMembership || myMembership.status !== "approved") && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {myMembership?.status === "pending"
                  ? "리더의 승인을 기다리고 있습니다."
                  : "모임에 참여하여 대시보드를 확인하세요."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

