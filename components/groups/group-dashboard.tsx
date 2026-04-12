"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatAuthor } from "@/lib/utils/book";
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
import {
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupMembershipStats,
  getNoteReactions,
} from "@/app/actions/groups";
import { toast } from "sonner";
import {
  Users,
  Lock,
  Globe,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  LogOut,
  Trash2,
  MoreVertical,
  Shield,
  Crown,
  BookOpen,
  PenLine,
  Heart,
  Flame,
} from "lucide-react";
import { formatSmartDate } from "@/lib/utils/date";
import { parseNoteContentFields } from "@/lib/utils/note";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { useUpgradeModal, isUpgradeLimitError } from "@/hooks/use-upgrade-modal";
import { typography, spacing } from "@/lib/design-tokens";
import { NOTE_TYPE_STYLES } from "@/lib/constants/note-type-styles";
import type { NoteStyleType } from "@/lib/constants/note-type-styles";
import Image from "next/image";
import { getImageUrl, isValidImageUrl } from "@/lib/utils/image";

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
    isGuestPreview?: boolean; // 비로그인 사용자 접근 시
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
  const { showUpgradeModal } = useUpgradeModal();
  const { group, members, myMembership, sharedNotes, isLeader, isPrivatePreview, isGuestPreview } = groupData;
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [reactionData, setReactionData] = useState<Record<string, { like: { count: number }; insightful: { count: number }; empathy: { count: number } }>>({});

  const isModerator = myMembership?.role === "moderator";

  // 대기 중인 멤버 수 조회
  useEffect(() => {
    if (isLeader || isModerator) {
      loadPendingCount();
    }
  }, [isLeader, isModerator, group.id]);

  // 활동 기록 리액션 로드
  useEffect(() => {
    if (sharedNotes.length > 0) {
      const noteIds = sharedNotes.map((sn: any) => sn.id);
      getNoteReactions(noteIds).then(setReactionData).catch(() => {});
    }
  }, [sharedNotes]);

  const loadPendingCount = async () => {
    try {
      const stats = await getGroupMembershipStats(group.id);
      setPendingCount(stats.pending);
    } catch (error) {
      console.error("멤버십 통계 조회 오류:", error);
    }
  };

  const handleJoin = async () => {
    // 승인제 모임이면 메시지 입력 다이얼로그 표시
    const joinType = group.join_type ?? (group.is_public ? "open" : "approval");
    if (joinType === "approval" && !showJoinDialog) {
      setShowJoinDialog(true);
      return;
    }

    setIsJoining(true);
    try {
      const result = await joinGroup(group.id, joinMessage.trim() || undefined);
      toast.success(
        result.autoApproved
          ? t("groups.joinedGroup")
          : t("groups.joinRequestSent")
      );
      setShowJoinDialog(false);
      setJoinMessage("");
      router.refresh();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t("groups.joinFailed");
      if (isUpgradeLimitError(errorMsg)) {
        showUpgradeModal({ feature: "모임", message: errorMsg });
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleReapply = async () => {
    const joinType = group.join_type ?? (group.is_public ? "open" : "approval");
    if (joinType === "approval") {
      setShowJoinDialog(true);
      return;
    }
    // open 모임은 바로 재신청
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
      toast.error(error instanceof Error ? error.message : t("groups.joinFailed"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      const result = await leaveGroup(group.id);
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(t("groups.leftGroup"));
      }
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
    <div className={spacing.pageSectionWide}>
      {/* 모임 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={typography.pageTitle}>{group.name}</h1>
            {(() => {
              const joinType = group.join_type ?? (group.is_public ? "open" : "approval");
              if (joinType === "open") return (
                <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-0">
                  <Globe className="mr-1 h-3 w-3" />
                  {t("groups.joinTypeOpen")}
                </Badge>
              );
              if (joinType === "private") return (
                <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-0">
                  <Lock className="mr-1 h-3 w-3" />
                  {t("groups.joinTypePrivate")}
                </Badge>
              );
              return (
                <Badge className="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-0">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {t("groups.joinTypeApproval")}
                </Badge>
              );
            })()}
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{t("groups.memberCount").replace("{count}", String(members.length))}</span>
            </div>
            {leader && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={leader?.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {leader?.name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <span>{leader?.name || t("groups.unknownUser")}</span>
              </div>
            )}
            <span suppressHydrationWarning>{formatSmartDate(group.created_at)}</span>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className={spacing.pageSection}>
          <TabsList className="flex-wrap h-auto gap-1 w-full sm:w-auto">
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
            <TabsTrigger value="notes">{t("groups.notesTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className={spacing.pageSection}>
            {/* 컴팩트 통계 요약 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab("members")}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t("groups.membersCardTitle")}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{members.length}</span>
                    <span className="text-sm text-muted-foreground">{t("stats.unitCount")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab("notes")}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <PenLine className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t("groups.sharedNotesCardTitle")}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{sharedNotes.length}</span>
                    <span className="text-sm text-muted-foreground">{t("stats.unitCount")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setActiveTab("books")}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                      <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs text-muted-foreground">{t("groups.designatedBooksCardTitle")}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{groupData.groupBooks?.length || 0}</span>
                    <span className="text-sm text-muted-foreground">{t("stats.unitBooks")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 활동 기록 (좋아요 많은 순 → 최신 순) */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-base">활동 기록</CardTitle>
                  </div>
                  {sharedNotes.length > 5 && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setActiveTab("notes")}
                    >
                      {t("groups.viewAll")} →
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {sharedNotes.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <PenLine className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">아직 활동이 없어요</p>
                    <p className="text-xs text-muted-foreground mt-1">첫 번째 기록을 공유해보세요!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(() => {
                      // 좋아요 총합 기준 정렬, 동일하면 최신 순
                      const sorted = [...sharedNotes].sort((a: any, b: any) => {
                        const aReactions = reactionData[a.id];
                        const bReactions = reactionData[b.id];
                        const aTotal = aReactions ? (aReactions.like.count + aReactions.insightful.count + aReactions.empathy.count) : 0;
                        const bTotal = bReactions ? (bReactions.like.count + bReactions.insightful.count + bReactions.empathy.count) : 0;
                        if (bTotal !== aTotal) return bTotal - aTotal;
                        return new Date(b.shared_at).getTime() - new Date(a.shared_at).getTime();
                      });

                      return sorted.slice(0, 5).map((item: any) => {
                        const note = item.notes;
                        const noteUser = note?.users;
                        const noteBook = note?.books || note?.book;
                        const styleType = (note?.type && note.type in NOTE_TYPE_STYLES ? note.type : "memo") as NoteStyleType;
                        const config = NOTE_TYPE_STYLES[styleType];
                        const TypeIcon = config.icon;
                        const reactions = reactionData[item.id];
                        const totalReactions = reactions ? (reactions.like.count + reactions.insightful.count + reactions.empathy.count) : 0;

                        return (
                          <div key={item.id} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className={`p-1.5 rounded-full shrink-0 ${config.bgColor}`}>
                              <TypeIcon className={`h-3.5 w-3.5 ${config.color}`} />
                            </div>
                            {noteUser && (
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={noteUser.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px]">{noteUser.name?.[0] || "?"}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                <span className="font-medium">{noteUser?.name}</span>
                                {noteBook && (
                                  <span className="text-muted-foreground"> · {noteBook.title}</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {(() => {
                                  const { quote, memo } = parseNoteContentFields(note?.content);
                                  return (quote || memo || "")?.slice(0, 80);
                                })()}
                              </p>
                            </div>
                            {note?.image_url && isValidImageUrl(note.image_url) && (
                              <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                                <Image src={getImageUrl(note.image_url)} alt="" fill className="object-cover" sizes="40px" />
                              </div>
                            )}
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              {totalReactions > 0 && (
                                <div className="flex items-center gap-0.5 text-rose-500">
                                  <Heart className="h-3 w-3 fill-current" />
                                  <span className="text-[10px] font-medium">{totalReactions}</span>
                                </div>
                              )}
                              <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                                {formatSmartDate(item.shared_at)}
                              </span>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 지정도서 현황 미리보기 */}
            {groupData.groupBooks && groupData.groupBooks.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{t("groups.designatedBooksCardTitle")}</CardTitle>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setActiveTab("books")}
                    >
                      {t("groups.viewAll")} →
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupData.groupBooks.slice(0, 3).map((gb: any) => {
                    const book = gb.books;
                    if (!book) return null;
                    const bookNoteCount = sharedNotes.filter((sn: any) => {
                      const noteBook = sn.notes?.books || sn.notes?.book;
                      return noteBook?.id === book.id;
                    }).length;
                    return (
                      <Link
                        key={gb.id}
                        href={`/groups/${group.id}/books/${book.id}`}
                        className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative w-8 h-11 rounded-md overflow-hidden bg-muted shrink-0">
                          {isValidImageUrl(book.cover_image_url) ? (
                            <Image src={getImageUrl(book.cover_image_url)} alt={book.title} fill className="object-cover" sizes="32px" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <BookOpen className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{book.title}</p>
                          {book.author && (
                            <p className="text-xs text-muted-foreground truncate">{formatAuthor(book.author)}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          <PenLine className="mr-1 h-3 w-3" />
                          {bookNoteCount}
                        </Badge>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* 구성원 미리보기 */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("groups.membersCardTitle")}</CardTitle>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setActiveTab("members")}
                  >
                    {t("groups.viewAll")} →
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  {members.slice(0, 8).map((member: any) => (
                    <Avatar key={member.id} className="h-8 w-8 ring-2 ring-background -ml-1 first:ml-0">
                      <AvatarImage src={member.users?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{member.users?.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 8 && (
                    <span className="text-xs text-muted-foreground ml-2">+{members.length - 8}</span>
                  )}
                </div>
              </CardContent>
            </Card>
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

          <TabsContent value="books" className={spacing.pageSection}>
            <GroupBooksManager groupId={group.id} groupName={group.name} isLeader={isLeader} />
          </TabsContent>

          <TabsContent value="notes" className={spacing.pageSection}>
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
              {myMembership?.status === "rejected" && (
                <>
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t("groups.rejectedTitle")}</h3>
                    <p className="text-muted-foreground">
                      {t("groups.rejectedDesc")}
                    </p>
                  </div>
                  <Button onClick={handleReapply} disabled={isJoining} size="lg">
                    {isJoining ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        {t("groups.joining")}
                      </>
                    ) : (
                      t("groups.reapplyJoin")
                    )}
                  </Button>
                </>
              )}
              {isGuestPreview && (
                <>
                  <Users className="h-12 w-12 text-primary/60 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold mb-2">공개 모임 미리보기</h3>
                    <p className="text-muted-foreground">
                      로그인하면 모임에 참여하고 기록을 함께 나눌 수 있어요
                    </p>
                  </div>
                </>
              )}
              {!isPrivatePreview && !isGuestPreview && !myMembership && (
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

      {/* 가입 신청 메시지 다이얼로그 (승인제 모임) */}
      <AlertDialog open={showJoinDialog} onOpenChange={(open) => {
        setShowJoinDialog(open);
        if (!open) setJoinMessage("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.joinRequestTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("groups.joinRequestDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={t("groups.joinMessagePlaceholder")}
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
            rows={3}
            maxLength={200}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground text-right">{joinMessage.length}/200</p>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleJoin} disabled={isJoining}>
              {isJoining ? t("groups.joining") : t("groups.submitJoinRequest")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

