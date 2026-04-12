"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, PenLine, ExternalLink } from "lucide-react";
import { updateGroupBook } from "@/app/actions/groups";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { GroupBookBundle, GroupBookLink } from "@/types/group";

interface GroupBookEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  bookId: string;
  bookTitle: string;
  currentDescription: string | null;
  currentLinks: GroupBookLink[];
  currentBundleId: string | null;
  bundles: GroupBookBundle[];
  onSuccess?: () => void;
}

export function GroupBookEditDialog({
  open,
  onOpenChange,
  groupId,
  bookId,
  bookTitle,
  currentDescription,
  currentLinks,
  currentBundleId,
  bundles,
  onSuccess,
}: GroupBookEditDialogProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(currentDescription || "");
  const [links, setLinks] = useState<GroupBookLink[]>(currentLinks || []);
  const [bundleId, setBundleId] = useState<string>(currentBundleId || "none");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDescription(currentDescription || "");
      setLinks(currentLinks?.length ? [...currentLinks] : []);
      setBundleId(currentBundleId || "none");
    }
  }, [open, currentDescription, currentLinks, currentBundleId]);

  const addLink = () => {
    setLinks((prev) => [...prev, { title: "", url: "" }]);
  };

  const updateLink = (index: number, field: "title" | "url", value: string) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // 빈 링크 제거
      const validLinks = links.filter((l) => l.title.trim() && l.url.trim());

      await updateGroupBook(groupId, bookId, {
        description: description.trim() || null,
        links: validLinks.length > 0 ? validLinks : null,
        bundleId: bundleId === "none" ? null : bundleId,
      });

      toast.success(t("groups.bookInfoUpdated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "수정에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            {t("groups.editBookInfo")}
          </DialogTitle>
          <DialogDescription>{bookTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* 리더 소개글 */}
          <div className="space-y-2">
            <Label>{t("groups.leaderDescription")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("groups.leaderDescPlaceholder")}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>

          {/* 참고 링크 */}
          <div className="space-y-2">
            <Label>{t("groups.customLinks")}</Label>
            {links.map((link, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Input
                    value={link.title}
                    onChange={(e) => updateLink(index, "title", e.target.value)}
                    placeholder={t("groups.linkTitlePlaceholder")}
                    className="h-8 text-sm"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                    placeholder={t("groups.linkUrlPlaceholder")}
                    className="h-8 text-sm"
                    type="url"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeLink(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addLink}
              className="w-full"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("groups.addLink")}
            </Button>
          </div>

          {/* 묶음 선택 */}
          {bundles.length > 0 && (
            <div className="space-y-2">
              <Label>{t("groups.moveToBundle")}</Label>
              <Select value={bundleId} onValueChange={setBundleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("groups.unbundled")}
                  </SelectItem>
                  {bundles.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            {isSaving ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
