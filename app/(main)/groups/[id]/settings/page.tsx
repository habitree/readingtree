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

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * 모임 설정 페이지
 * 리더만 접근 가능
 */
export default function GroupSettingsPage({ params }: PageProps) {
  const router = useRouter();
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
        setError(err instanceof Error ? err.message : "모임 정보를 불러올 수 없습니다.");
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
      toast.success("모임 설정이 저장되었습니다.");
      router.push(`/groups/${groupId}`);
    } catch (err) {
      console.error("모임 수정 오류:", err);
      toast.error(err instanceof Error ? err.message : "모임 수정에 실패했습니다.");
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
      toast.success("초대 링크가 복사되었습니다.");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("링크 복사 오류:", err);
      toast.error("링크 복사에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    setIsDeleting(true);
    try {
      await deleteGroup(groupId);
      toast.success("모임이 삭제되었습니다.");
      router.push("/groups");
    } catch (err) {
      console.error("모임 삭제 오류:", err);
      toast.error(err instanceof Error ? err.message : "모임 삭제에 실패했습니다.");
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
            모임 목록으로
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                리더만 모임 설정에 접근할 수 있습니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/groups/${groupId}`} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          모임으로 돌아가기
        </Link>
      </Button>

      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">모임 설정</h1>
        <p className="text-muted-foreground">모임 정보를 수정하세요</p>
      </div>

      {/* 기본 정보 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>모임의 이름과 설명을 수정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">모임 이름 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="예: 2024년 독서 모임"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">모임 설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="모임에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">공개 모임</Label>
                <p className="text-sm text-muted-foreground">
                  공개 모임은 누구나 찾아서 참여할 수 있습니다.
                  <br />
                  비공개로 변경하면 새로운 참여자는 승인이 필요합니다.
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
                    저장 중...
                  </>
                ) : (
                  "변경사항 저장"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/groups/${groupId}`)}
              >
                취소
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
            초대 링크
          </CardTitle>
          <CardDescription>
            {formData.isPublic
              ? "이 링크를 공유하면 누구나 모임에 바로 참여할 수 있습니다."
              : "비공개 모임입니다. 링크를 받은 사용자는 참여 신청 후 승인을 받아야 합니다."}
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
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  복사
                </>
              )}
            </Button>
          </div>
          {!formData.isPublic && (
            <p className="text-sm text-amber-600 mt-3">
              비공개 모임이므로, 참여 신청이 들어오면 멤버 관리에서 승인해주세요.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 위험 영역 */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">위험 영역</CardTitle>
          <CardDescription>
            이 작업은 되돌릴 수 없습니다. 신중하게 결정해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="font-medium">모임 삭제</p>
              <p className="text-sm text-muted-foreground">
                모임과 모든 관련 데이터(기록, 지정도서 등)가 영구적으로 삭제됩니다.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  모임 삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말 모임을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="font-medium">{formData.name}</span> 모임과 모든 관련
                    데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        삭제 중...
                      </>
                    ) : (
                      "삭제하기"
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
