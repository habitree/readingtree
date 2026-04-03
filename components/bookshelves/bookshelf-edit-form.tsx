"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateBookshelf, deleteBookshelf, unlinkBookshelfFromGroup } from "@/app/actions/bookshelves";
import { BookshelfWithStats } from "@/types/bookshelf";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Trash2, Save, Users, LinkIcon, Unlink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

interface BookshelfEditFormProps {
  bookshelf: BookshelfWithStats;
}

export function BookshelfEditForm({ bookshelf }: BookshelfEditFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState(bookshelf.name);
  const [description, setDescription] = useState(bookshelf.description || "");
  const [isPublic, setIsPublic] = useState(bookshelf.is_public);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const isGroupBookshelf = !!bookshelf.group_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("bookshelves.bookshelfNameRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBookshelf(bookshelf.id, {
        name: name.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      toast.success(t("bookshelves.saved"));
      router.push(`/bookshelves/${bookshelf.id}`);
      router.refresh();
    } catch (error) {
      console.error("서재 수정 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("bookshelves.editFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBookshelf(bookshelf.id);
      toast.success(t("bookshelves.deleted"));
      router.push("/bookshelves");
      router.refresh();
    } catch (error) {
      console.error("서재 삭제 오류:", error);
      toast.error(
        error instanceof Error ? error.message : t("bookshelves.deleteFailed")
      );
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      await unlinkBookshelfFromGroup(bookshelf.id);
      toast.success("모임 연결이 해제되었습니다.");
      router.push(`/bookshelves/${bookshelf.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "연결 해제에 실패했습니다."
      );
    } finally {
      setIsUnlinking(false);
      setUnlinkDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {isGroupBookshelf && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              연결된 모임
            </CardTitle>
            <CardDescription>
              모임 지정도서가 이 서재에 자동 동기화됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{bookshelf.group_name || "독서모임"}</span>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                  자동 동기화
                </Badge>
              </div>
              <Link href={`/groups/${bookshelf.group_id}`}>
                <Button variant="outline" size="sm">
                  모임 보기
                </Button>
              </Link>
            </div>
            <div className="border-t pt-4">
              <Dialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Unlink className="mr-2 h-4 w-4" />
                    모임 연결 해제
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>모임 연결을 해제하시겠습니까?</DialogTitle>
                    <DialogDescription>
                      연결을 해제하면 모임 지정도서가 더 이상 자동 동기화되지 않습니다.
                      기존 책은 그대로 유지됩니다. 모임 멤버십에는 영향이 없습니다.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setUnlinkDialogOpen(false)}
                      disabled={isUnlinking}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleUnlink}
                      disabled={isUnlinking}
                    >
                      {isUnlinking ? t("common.loading") : "연결 해제"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("bookshelves.bookshelfInfo")}</CardTitle>
          <CardDescription>{t("bookshelves.bookshelfInfoDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("bookshelves.bookshelfNameLabel")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("bookshelves.bookshelfNamePlaceholder")}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("bookshelves.descriptionLabel")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("bookshelves.descriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="is-public" className="text-sm font-medium cursor-pointer">{t("bookshelves.bookshelfPublic")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("bookshelves.bookshelfPublicDesc")}
                </p>
              </div>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            <div className="flex items-center justify-between pt-4">
              {isGroupBookshelf ? (
                <p className="text-sm text-muted-foreground">
                  모임서재는 직접 삭제할 수 없습니다.
                </p>
              ) : (
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isSubmitting || isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("bookshelves.deleteBookshelf")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("bookshelves.deleteBookshelfConfirm")}</DialogTitle>
                      <DialogDescription>
                        {t("bookshelves.deleteBookshelfDesc")}
                        <br />
                        <strong className="text-destructive">
                          {t("bookshelves.deleteIrreversible")}
                        </strong>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={isDeleting}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? t("common.loading") : t("common.delete")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? t("common.loading") : t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bookshelves.bookshelfStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">{t("bookshelves.totalBooks")}</div>
              <div className="text-2xl font-bold">{bookshelf.book_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("bookshelves.readingBooks")}</div>
              <div className="text-2xl font-bold">{bookshelf.reading_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("bookshelves.completedBooks")}</div>
              <div className="text-2xl font-bold">{bookshelf.completed_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("bookshelves.pausedBooks")}</div>
              <div className="text-2xl font-bold">{bookshelf.paused_count}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("bookshelves.rereadingBooks")}</div>
              <div className="text-2xl font-bold">{bookshelf.rereading_count}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
