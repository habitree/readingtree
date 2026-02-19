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
import { createBookshelf } from "@/app/actions/bookshelves";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function CreateBookshelfDialog() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("bookshelves.bookshelfNameRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      await createBookshelf({
        name: name.trim(),
        description: description.trim() || null,
      });
      toast.success(t("bookshelves.bookshelfCreated"));
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (error) {
      console.error("서재 생성 오류:", error);
      const errorMessage = error instanceof Error ? error.message : t("bookshelves.createFailed");
      toast.error(errorMessage);
      // 최대 개수 제한 오류인 경우 다이얼로그를 닫지 않음
      if (errorMessage.includes("최대 5개")) {
        setIsSubmitting(false);
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("bookshelves.createBookshelf")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t("bookshelves.createBookshelf")}</DialogTitle>
            <DialogDescription>
              {t("bookshelves.createBookshelfDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("bookshelves.creating") : t("bookshelves.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
