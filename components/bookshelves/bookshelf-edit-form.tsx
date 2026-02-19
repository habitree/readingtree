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
import { updateBookshelf, deleteBookshelf } from "@/app/actions/bookshelves";
import { BookshelfWithStats } from "@/types/bookshelf";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Trash2, Save } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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

  return (
    <div className="space-y-6">
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
