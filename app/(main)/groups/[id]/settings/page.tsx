"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { ArrowLeft, Loader2, Trash2, AlertTriangle, Copy, Check, Link as LinkIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { InviteLinkDialog } from "@/components/groups/invite-link-dialog";
import { typography, spacing } from "@/lib/design-tokens";

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
    isPublic: true,
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
          isPublic: group.is_public ?? true,
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
        isPublic: formData.isPublic,
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

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">{t("groups.groupPublicLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("groups.groupPublicPrivateDesc").split("\n").map((line, i) => (
                    i === 0 ? line : <><br key={i} />{line}</>
                  ))}
                </p>
              </div>
              <Switch
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublic: checked })
                }
              />
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
            {formData.isPublic
              ? t("groups.inviteLinkPublicDesc")
              : t("groups.inviteLinkPrivateDesc")}
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
          {!formData.isPublic && (
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
