"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  approveMember,
  rejectMember,
  getPendingMembers,
  removeMember,
  updateMemberRole,
  transferLeadership,
  approveAllPendingMembers,
} from "@/app/actions/groups";
import { toast } from "sonner";
import {
  Crown,
  Check,
  X,
  Loader2,
  MoreVertical,
  UserMinus,
  Shield,
  ShieldOff,
  ArrowRightLeft,
  Users,
  Clock,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { MemberRole } from "@/types/group";

interface MemberListProps {
  members: Array<{
    id: string;
    user_id: string;
    role: string;
    status: string;
    users: {
      id: string;
      name: string;
      avatar_url: string | null;
    } | null;
  }>;
  isLeader: boolean;
  isModerator?: boolean;
  groupId: string;
  currentUserId?: string;
}

function MemberSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getRoleBadge(role: string, isGroupLeader: boolean) {
  if (isGroupLeader || role === "leader") {
    return (
      <Badge className="text-xs bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
        <Crown className="mr-1 h-3 w-3" />
        리더
      </Badge>
    );
  }
  if (role === "moderator") {
    return (
      <Badge className="text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0">
        <Shield className="mr-1 h-3 w-3" />
        부리더
      </Badge>
    );
  }
  return null;
}

export function MemberList({
  members,
  isLeader,
  isModerator = false,
  groupId,
  currentUserId,
}: MemberListProps) {
  const router = useRouter();
  const [pendingMembers, setPendingMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 권한 분리: 멤버 관리(승인/거절/내보내기)는 리더 또는 부리더, 역할 변경/위임은 리더만
  const canManageMembers = isLeader || isModerator;
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "kick" | "transfer" | "role" | null;
    userId: string;
    userName: string;
    newRole?: MemberRole;
  }>({
    open: false,
    type: null,
    userId: "",
    userName: "",
  });

  useEffect(() => {
    loadPendingMembers();
  }, [groupId]);

  const loadPendingMembers = async () => {
    try {
      setIsLoading(true);
      if (canManageMembers) {
        const data = await getPendingMembers(groupId);
        setPendingMembers(data);
      }
    } catch (error) {
      console.error("대기 멤버 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      await approveMember(groupId, userId);
      toast.success("멤버가 승인되었습니다.");
      setPendingMembers((prev) => prev.filter((m) => m.user_id !== userId));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "멤버 승인에 실패했습니다."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    try {
      await rejectMember(groupId, userId);
      toast.success("멤버 신청이 거절되었습니다.");
      setPendingMembers((prev) => prev.filter((m) => m.user_id !== userId));
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "멤버 거절에 실패했습니다."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    setActionLoading("all");
    try {
      const result = await approveAllPendingMembers(groupId);
      toast.success(`${result.count}명의 멤버가 승인되었습니다.`);
      setPendingMembers([]);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "일괄 승인에 실패했습니다."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleKick = async () => {
    if (!confirmDialog.userId) return;
    setActionLoading(confirmDialog.userId);
    try {
      await removeMember(groupId, confirmDialog.userId);
      toast.success(`${confirmDialog.userName}님이 모임에서 제외되었습니다.`);
      setConfirmDialog({ open: false, type: null, userId: "", userName: "" });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "멤버 제외에 실패했습니다."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async () => {
    if (!confirmDialog.userId || !confirmDialog.newRole) return;
    if (confirmDialog.newRole === "leader") return; // leader role change uses transferLeadership
    setActionLoading(confirmDialog.userId);
    try {
      await updateMemberRole(groupId, confirmDialog.userId, confirmDialog.newRole as "moderator" | "member");
      toast.success(
        `${confirmDialog.userName}님의 역할이 ${
          confirmDialog.newRole === "moderator" ? "부리더" : "멤버"
        }로 변경되었습니다.`
      );
      setConfirmDialog({ open: false, type: null, userId: "", userName: "" });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "역할 변경에 실패했습니다."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransfer = async () => {
    if (!confirmDialog.userId) return;
    setActionLoading(confirmDialog.userId);
    try {
      await transferLeadership(groupId, confirmDialog.userId);
      toast.success(`${confirmDialog.userName}님에게 리더가 위임되었습니다.`);
      setConfirmDialog({ open: false, type: null, userId: "", userName: "" });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "리더 위임에 실패했습니다."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmDialog = (
    type: "kick" | "transfer" | "role",
    userId: string,
    userName: string,
    newRole?: MemberRole
  ) => {
    setConfirmDialog({ open: true, type, userId, userName, newRole });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>구성원 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <MemberSkeleton />
        </CardContent>
      </Card>
    );
  }

  const approvedMembers = members.filter((m) => m.status === "approved");
  const sortedMembers = [...approvedMembers].sort((a, b) => {
    const roleOrder: Record<string, number> = { leader: 0, moderator: 1, member: 2 };
    return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
  });

  return (
    <>
      <div className="space-y-4">
        {/* 대기 중인 멤버 (리더/부리더만 표시) */}
        {canManageMembers && pendingMembers.length > 0 && (
          <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  승인 대기 중
                  <Badge variant="secondary" className="ml-1">
                    {pendingMembers.length}명
                  </Badge>
                </CardTitle>
                {pendingMembers.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApproveAll}
                    disabled={actionLoading === "all"}
                    className="text-xs"
                  >
                    {actionLoading === "all" ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    )}
                    전체 승인
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {pendingMembers.map((member) => {
                  const user = member.users;
                  const userName = user?.name || `사용자 ${member.user_id.slice(0, 8)}`;
                  const isProcessing = actionLoading === member.user_id;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background border animate-in fade-in slide-in-from-top-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Link href={`/profile/${member.user_id}`}>
                          <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/20 transition-all">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback>{userName[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${member.user_id}`}
                            className="font-medium hover:underline truncate block"
                          >
                            {userName}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            참여 신청 대기 중
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(member.user_id)}
                          disabled={isProcessing}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(member.user_id)}
                          disabled={isProcessing}
                          className="h-8"
                        >
                          {isProcessing ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-1 h-4 w-4" />
                          )}
                          승인
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 멤버 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                구성원
                <Badge variant="outline" className="ml-1">
                  {approvedMembers.length}명
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {approvedMembers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">구성원이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedMembers.map((member, index) => {
                  const user = member.users;
                  const userName = user?.name || `사용자 ${member.user_id.slice(0, 8)}`;
                  const isGroupLeader = member.role === "leader";
                  const isMemberModerator = member.role === "moderator";
                  const isCurrentUser = member.user_id === currentUserId;
                  // 리더: 역할 변경, 리더 위임, 내보내기 모두 가능
                  // 부리더: 내보내기만 가능 (자기보다 권한 높은 리더 제외)
                  const canManageRole = isLeader && !isGroupLeader && !isCurrentUser;
                  const canKick = canManageMembers && !isGroupLeader && !isCurrentUser && !(isModerator && isMemberModerator);
                  const showManageMenu = canManageRole || canKick;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Link href={`/profile/${member.user_id}`}>
                          <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary/20 transition-all">
                            <AvatarImage src={user?.avatar_url || undefined} />
                            <AvatarFallback>{userName[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/profile/${member.user_id}`}
                              className="font-medium hover:underline truncate"
                            >
                              {userName}
                            </Link>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                나
                              </Badge>
                            )}
                            {getRoleBadge(member.role, isGroupLeader)}
                          </div>
                          {!user && (
                            <p className="text-xs text-muted-foreground">
                              프로필 정보를 불러올 수 없습니다
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 멤버 관리 드롭다운 (리더/부리더) */}
                      {showManageMenu && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={actionLoading === member.user_id}
                            >
                              {actionLoading === member.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* 역할 변경 - 리더만 */}
                            {canManageRole && (
                              <>
                                {isMemberModerator ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openConfirmDialog("role", member.user_id, userName, "member")
                                    }
                                  >
                                    <ShieldOff className="mr-2 h-4 w-4" />
                                    부리더 해제
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openConfirmDialog("role", member.user_id, userName, "moderator")
                                    }
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    부리더 임명
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    openConfirmDialog("transfer", member.user_id, userName)
                                  }
                                >
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  리더 위임
                                </DropdownMenuItem>
                              </>
                            )}
                            {/* 내보내기 - 리더 또는 부리더 */}
                            {canKick && (
                              <>
                                {canManageRole && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  onClick={() =>
                                    openConfirmDialog("kick", member.user_id, userName)
                                  }
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserMinus className="mr-2 h-4 w-4" />
                                  내보내기
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 확인 다이얼로그 */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.type === "kick" && "멤버를 내보내시겠어요?"}
              {confirmDialog.type === "transfer" && "리더를 위임하시겠어요?"}
              {confirmDialog.type === "role" &&
                (confirmDialog.newRole === "moderator"
                  ? "부리더로 임명하시겠어요?"
                  : "부리더를 해제하시겠어요?")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.type === "kick" && (
                <>
                  <span className="font-medium">{confirmDialog.userName}</span>
                  님을 모임에서 내보냅니다. 이 작업은 되돌릴 수 없습니다.
                </>
              )}
              {confirmDialog.type === "transfer" && (
                <>
                  <span className="font-medium">{confirmDialog.userName}</span>
                  님에게 리더 권한을 위임합니다. 위임 후 본인은 일반 멤버가 됩니다.
                </>
              )}
              {confirmDialog.type === "role" &&
                confirmDialog.newRole === "moderator" && (
                  <>
                    <span className="font-medium">{confirmDialog.userName}</span>
                    님을 부리더로 임명합니다. 부리더는 멤버 승인/거절 권한을 가집니다.
                  </>
                )}
              {confirmDialog.type === "role" &&
                confirmDialog.newRole === "member" && (
                  <>
                    <span className="font-medium">{confirmDialog.userName}</span>
                    님의 부리더 권한을 해제합니다.
                  </>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog.type === "kick") handleKick();
                else if (confirmDialog.type === "transfer") handleTransfer();
                else if (confirmDialog.type === "role") handleRoleChange();
              }}
              className={
                confirmDialog.type === "kick"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmDialog.type === "kick" && "내보내기"}
              {confirmDialog.type === "transfer" && "위임하기"}
              {confirmDialog.type === "role" &&
                (confirmDialog.newRole === "moderator" ? "임명하기" : "해제하기")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
