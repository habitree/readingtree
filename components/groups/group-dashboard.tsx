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
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation();
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
          ? t("groups.joinedGroup")
          : t("groups.joinRequestSent")
      );
      router.refresh();
    } catch (error) {
      console.error("모임 참여 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("groups.joinFailed")
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGroup(group.id);
      toast.success(t("groups.leftGroup"));
      router.push("/groups");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("groups.leaveFailed")
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
      toast.success(t("groups.groupDeleted"));
      router.push("/groups");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("groups.deleteFailed")
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
                  {t("groups.public")}
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  {t("groups.private")}
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
              <span>{t("groups.memberCount").replace("{count}", String(members.length))}</span>
            </div>
            {leader && (
              <div className="flex items-center gap-2">
                <span>{t("groups.leader")}:</span>
                <div className="flex items-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={leader?.avatar_url || undefined} />
                    <AvatarFallback>
                      {leader?.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{leader?.name || t("groups.unknownUser")}</span>
                </div>
              </div>
            )}
            <span>{t("groups.createdAt")} {formatSmartDate(group.created_at)}</span>
          </div>
        </div>

        {/* 참여/멤버 상태 및 설정 */}
        <div className="flex items-center gap-2 shrink-0">
          {!myMembership && (
            <Button onClick={handleJoin} disabled={isJoining}>
              {isJoining ? t("groups.processing") : t("groups.joinRequest")}
            </Button>
          )}
          {myMembership && myMembership.status === "pending" && (
            <Button variant="outline" disabled>
              <Clock className="mr-2 h-4 w-4" />
              {t("groups.pendingApproval")}
            </Button>
          )}
          {myMembership && myMembership.status === "approved" && (
            <>
              {/* 역할 배지 */}
              {isLeader ? (
                <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
                  <Crown className="mr-1 h-3 w-3" />
                  {t("groups.leader")}
                </Badge>
              ) : isModerator ? (
                <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0">
                  <Shield className="mr-1 h-3 w-3" />
                  {t("groups.subleader")}
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {t("groups.member")}
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
                          {t("groups.groupSettings")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("groups.deleteGroup")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {!isLeader && (
                    <DropdownMenuItem
                      onClick={() => setShowLeaveDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("groups.leaveGroupAction")}
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
            <TabsTrigger value="overview">{t("groups.overviewTab")}</TabsTrigger>
            <TabsTrigger value="members" className="relative">
              {t("groups.membersTab")}
              {pendingCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="books">{t("groups.booksTab")}</TabsTrigger>
            <TabsTrigger value="shared-library">{t("groups.sharedLibraryTab")}</TabsTrigger>
            <TabsTrigger value="notes">{t("groups.notesTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("groups.membersCardTitle")}</CardTitle>
                  <CardDescription>{t("groups.membersCardDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{t("groups.memberCount").replace("{count}", String(members.length))}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("groups.sharedNotesCardTitle")}</CardTitle>
                  <CardDescription>{t("groups.sharedNotesCardDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{t("groups.noteCountLabel").replace("{count}", String(sharedNotes.length))}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("groups.designatedBooksCardTitle")}</CardTitle>
                  <CardDescription>{t("groups.designatedBooksCardDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{groupData.groupBooks?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("groups.sharedLibraryCardTitle")}</CardTitle>
                  <CardDescription>{t("groups.sharedLibraryCardDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{groupData.sharedBooks?.length || 0}</div>
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

          <TabsContent value="books" className="space-y-6">
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
                    <h3 className="text-lg font-semibold mb-2">{t("groups.privateGroup")}</h3>
                    <p className="text-muted-foreground">
                      {t("groups.privateGroupDesc")}
                    </p>
                  </div>
                  {!myMembership && (
                    <Button onClick={handleJoin} disabled={isJoining} size="lg">
                      {isJoining ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          {t("groups.processing")}
                        </>
                      ) : (
                        t("groups.requestJoin")
                      )}
                    </Button>
                  )}
                </>
              )}
              {myMembership?.status === "pending" && (
                <>
                  <Clock className="h-12 w-12 text-amber-500 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t("groups.pendingApprovalTitle")}</h3>
                    <p className="text-muted-foreground">
                      {t("groups.pendingApprovalDesc")}
                    </p>
                  </div>
                </>
              )}
              {!isPrivatePreview && !myMembership && (
                <p className="text-muted-foreground">
                  {t("groups.joinToDashboard")}
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
            <AlertDialogTitle>{t("groups.leaveConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("groups.leaveConfirmDesc").replace("{name}", group.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              disabled={isLeaving}
              variant="destructive"
            >
              {isLeaving ? t("groups.processing") : t("groups.leaving")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모임 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              {t("groups.deleteConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t("groups.deleteConfirmDesc").replace("{name}", group.name)}
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li>{t("groups.deleteConfirmNotes").replace("{count}", String(sharedNotes?.length || 0))}</li>
                  <li>{t("groups.deleteConfirmBooks").replace("{count}", String(groupData.groupBooks?.length || 0))}</li>
                  <li>{t("groups.deleteConfirmSharedLib").replace("{count}", String(groupData.sharedBooks?.length || 0))}</li>
                  <li>{t("groups.deleteConfirmMembers").replace("{count}", String(members.length))}</li>
                  <li>{t("groups.deleteConfirmStats")}</li>
                </ul>
                <p className="text-destructive font-medium">
                  {t("groups.irreversible")}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? t("groups.deleting") : t("groups.deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

