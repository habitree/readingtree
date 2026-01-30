"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MemberList } from "./member-list";
import { SharedNotesList } from "./shared-notes-list";
import { GroupBooksManager } from "./group-books-manager";
import { SharedBooksManager } from "./shared-books-manager";
import {
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupMembershipStats,
} from "@/app/actions/groups";
import { toast } from "sonner";
import {
  Users,
  Lock,
  Globe,
  CheckCircle2,
  Clock,
  Settings,
  LogOut,
  Trash2,
  MoreVertical,
  Shield,
  Crown,
} from "lucide-react";
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
    isPrivatePreview?: boolean; // 비공개 모임 링크 접근 시
  };
  currentUserId?: string;
}

/**
 * 모임 대시보드 컴포넌트
 * 모임 정보, 구성원, 공유 기록 표시
 */
export function GroupDashboard({ groupData, currentUserId }: GroupDashboardProps) {
  const router = useRouter();
  const { group, members, myMembership, sharedNotes, isLeader, isPrivatePreview } = groupData;
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const isModerator = myMembership?.role === "moderator";

  // 대기 중인 멤버 수 조회
  useEffect(() => {
    if (isLeader || isModerator) {
      loadPendingCount();
    }
  }, [isLeader, isModerator, group.id]);

  const loadPendingCount = async () => {
    try {
      const stats = await getGroupMembershipStats(group.id);
      setPendingCount(stats.pending);
    } catch (error) {
      console.error("멤버십 통계 조회 오류:", error);
    }
  };

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

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGroup(group.id);
      toast.success("모임에서 나왔습니다.");
      router.push("/groups");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "모임 나가기에 실패했습니다."
      );
    } finally {
      setIsLeaving(false);
      setShowLeaveDialog(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGroup(group.id);
      toast.success("모임이 삭제되었습니다.");
      router.push("/groups");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "모임 삭제에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
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

        {/* 참여/멤버 상태 및 설정 */}
        <div className="flex items-center gap-2 shrink-0">
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
            <>
              {/* 역할 배지 */}
              {isLeader ? (
                <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
                  <Crown className="mr-1 h-3 w-3" />
                  리더
                </Badge>
              ) : isModerator ? (
                <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0">
                  <Shield className="mr-1 h-3 w-3" />
                  부리더
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  멤버
                </Badge>
              )}

              {/* 설정 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isLeader && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/groups/${group.id}/settings`}>
                          <Settings className="mr-2 h-4 w-4" />
                          모임 설정
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        모임 삭제
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isLeader && (
                    <DropdownMenuItem
                      onClick={() => setShowLeaveDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      모임 나가기
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* 대시보드 탭 */}
      {myMembership && myMembership.status === "approved" && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="members" className="relative">
              구성원
              {pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="books">지정도서</TabsTrigger>
            <TabsTrigger value="shared-library">공유 서재</TabsTrigger>
            <TabsTrigger value="notes">공유 기록</TabsTrigger>
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
            <MemberList
              members={members}
              isLeader={isLeader}
              isModerator={isModerator}
              groupId={group.id}
              currentUserId={currentUserId}
            />
          </TabsContent>

          <TabsContent value="books">
            <GroupBooksManager groupId={group.id} isLeader={isLeader} />
          </TabsContent>

          <TabsContent value="shared-library">
            <SharedBooksManager groupId={group.id} />
          </TabsContent>

          <TabsContent value="notes">
            <SharedNotesList notes={sharedNotes} groupId={group.id} />
          </TabsContent>
        </Tabs>
      )}

      {/* 비멤버용 안내 */}
      {(!myMembership || myMembership.status !== "approved") && (
        <Card className={isPrivatePreview ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              {isPrivatePreview && (
                <>
                  <Lock className="h-12 w-12 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">비공개 모임</h3>
                    <p className="text-muted-foreground">
                      이 모임은 비공개입니다. 참여하려면 리더의 승인이 필요합니다.
                    </p>
                  </div>
                  {!myMembership && (
                    <Button onClick={handleJoin} disabled={isJoining} size="lg">
                      {isJoining ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        "참여 신청하기"
                      )}
                    </Button>
                  )}
                </>
              )}
              {myMembership?.status === "pending" && (
                <>
                  <Clock className="h-12 w-12 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">승인 대기 중</h3>
                    <p className="text-muted-foreground">
                      참여 신청이 완료되었습니다. 리더의 승인을 기다리고 있습니다.
                    </p>
                  </div>
                </>
              )}
              {!isPrivatePreview && !myMembership && (
                <p className="text-muted-foreground">
                  모임에 참여하여 대시보드를 확인하세요.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 모임 나가기 확인 다이얼로그 */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모임을 나가시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{group.name}</span> 모임에서 나갑니다.
              다시 참여하려면 새로 신청해야 합니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              variant="destructive"
            >
              {isLeaving ? "처리 중..." : "나가기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모임 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              모임을 삭제하시겠어요?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  <span className="font-medium">{group.name}</span> 모임을 삭제하면
                  다음 데이터가 모두 삭제됩니다:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>모임에 공유된 모든 기록 ({sharedNotes?.length || 0}개)</li>
                  <li>지정도서 목록 ({groupData.groupBooks?.length || 0}권)</li>
                  <li>공유된 서재 ({groupData.sharedBooks?.length || 0}개)</li>
                  <li>멤버 정보 ({members.length}명)</li>
                  <li>멤버 활동 통계</li>
                </ul>
                <p className="text-destructive font-medium">
                  이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? "삭제 중..." : "삭제하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

