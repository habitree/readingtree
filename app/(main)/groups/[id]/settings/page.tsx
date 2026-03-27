"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  getGroupForSettings,
  updateGroup,
  deleteGroup,
} from "@/app/actions/groups";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Trash2, AlertTriangle, Copy, Check, Link as LinkIcon, Globe, ShieldCheck, Lock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { InviteLinkDialog } from "@/components/groups/invite-link-dialog";
import { typography, spacing } from "@/lib/design-tokens";
import type { JoinType } from "@/types/group";

const JOIN_TYPE_OPTIONS: Array<{
  value: JoinType;
  icon: typeof Globe;
  colorClass: string;
  selectedClass: string;
}> = [
  {
    value: "open",
    icon: Globe,
    colorClass: "text-green-600 dark:text-green-400",
    selectedClass: "border-green-500 bg-green-50 dark:bg-green-950/20",
  },
  {
    value: "approval",
    icon: ShieldCheck,
    colorClass: "text-blue-600 dark:text-blue-400",
    selectedClass: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
  },
  {
    value: "private",
    icon: Lock,
    colorClass: "text-amber-600 dark:text-amber-400",
    selectedClass: "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
  },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 모임 설정 페이지
 * 리더만 접근 가능
 */
export default function GroupSettingsPage({ params }: PageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    joinType: "approval" as JoinType,
  });
  const [isCopied, setIsCopied] = useState(false);

  // 파라미터 및 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        setGroupId(resolvedParams.id);

        const group = await getGroupForSettings(resolvedParams.id);
        setFormData({
          name: group.name || "",
          description: group.description || "",
          joinType: (group.join_type as JoinType) || (group.is_public ? "open" : "approval"),
        });
      } catch (err) {
        console.error("모임 설정 로드 오류:", err);
        setError(err instanceof Error ? err.message : t("groups.groupLoadError"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;

    setIsSaving(true);
    try {
      await updateGroup(groupId, {
        name: formData.name,
        description: formData.description,
        joinType: formData.joinType,
      });
      toast.success(t("groups.groupSaveSuccess"));
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("모임 수정 오류:", err);
      toast.error(err instanceof Error ? err.message : t("groups.groupSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!groupId) return;

    const inviteLink = `${window.location.origin}/groups/${groupId}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setIsCopied(true);
      toast.success(t("groups.inviteLinkCopied"));
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("링크 복사 오류:", err);
      toast.error(t("groups.inviteLinkCopyFailed"));
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    setIsDeleting(true);
    try {
      await deleteGroup(groupId);
      toast.success(t("groups.groupDeleteSuccess"));
      router.push("/groups");
    } catch (err) {
      console.error("모임 삭제 오류:", err);
      toast.error(err instanceof Error ? err.message : t("groups.groupDeleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/groups" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {t("groups.backToGroupList")}
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("groups.leaderOnlyError")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={spacing.pageSectionWide}>
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/groups/${groupId}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          {t("groups.backToGroup")}
        </Link>
      </Button>

      {/* 헤더 */}
      <div>
        <h1 className={typography.pageTitle}>{t("groups.settingsPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("groups.settingsPageDesc")}</p>
      </div>

      {/* 기본 정보 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("groups.basicInfoCardTitle")}</CardTitle>
          <CardDescription>{t("groups.basicInfoCardDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("groups.groupNameLabel")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("groups.groupNamePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("groups.groupDescLabel")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("groups.groupDescPlaceholder")}
                rows={4}
              />
            </div>

            {/* 가입 방식 선택 */}
            <div className="space-y-3">
              <Label>{t("groups.joinTypeLabel")}</Label>
              <div className="grid gap-2">
                {JOIN_TYPE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.joinType === option.value;
                  const labelKey = `joinType${option.value.charAt(0).toUpperCase() + option.value.slice(1)}` as
                    | "joinTypeOpen"
                    | "joinTypeApproval"
                    | "joinTypePrivate";
                  const descKey = `${labelKey}Desc` as
                    | "joinTypeOpenDesc"
                    | "joinTypeApprovalDesc"
                    | "joinTypePrivateDesc";

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, joinType: option.value })
                      }
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? option.selectedClass
                          : "border-transparent bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${option.colorClass}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">
                          {t(`groups.${labelKey}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(`groups.${descKey}`)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("groups.joinTypeChangeWarning")}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSaving || !formData.name}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("groups.savingLabel")}
                  </>
                ) : (
                  t("groups.saveChangesBtn")
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/groups/${groupId}`)}
              >
                {t("groups.groupCancelBtn")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 초대 링크 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {t("groups.inviteLinkCardTitle")}
          </CardTitle>
          <CardDescription>
            {formData.joinType === "private"
              ? t("groups.inviteLinkPrivateDesc")
              : t("groups.inviteLinkPublicDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              readOnly
              value={groupId ? `${typeof window !== "undefined" ? window.location.origin : ""}/groups/${groupId}` : ""}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="shrink-0"
            >
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                  {t("groups.linkCopiedBtn")}
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  {t("groups.copyLinkBtn")}
                </>
              )}
            </Button>
          </div>
          {formData.joinType === "approval" && (
            <p className="text-sm text-amber-600 mt-3">
              {t("groups.privateGroupApprovalHint")}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {groupId && <InviteLinkDialog groupId={groupId} />}
          </div>
        </CardContent>
      </Card>

      {/* 위험 영역 */}
      <Card variant="destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t("groups.dangerZoneCardTitle")}</CardTitle>
          <CardDescription>
            {t("groups.dangerZoneCardDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">{t("groups.deleteGroupLabel")}</p>
              <p className="text-sm text-muted-foreground">
                {t("groups.deleteGroupDesc")}
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("groups.deleteGroupBtn")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("groups.deleteGroupConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-medium">{formData.name}</span>{" "}
                    {t("groups.deleteGroupConfirmDesc").replace("{name}", "").trim()}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("groups.groupCancelBtn")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="destructive"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("groups.deletingLabel")}
                      </>
                    ) : (
                      t("groups.deleteGroupAction")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
