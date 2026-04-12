"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, FolderPlus } from "lucide-react";
import {
  createGroupBookBundle,
  updateGroupBookBundle,
} from "@/app/actions/groups";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import type { GroupBookBundle } from "@/types/group";

interface BundleManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  bundle?: GroupBookBundle | null; // null = 생성 모드
  onSuccess?: () => void;
}

export function BundleManageDialog({
  open,
  onOpenChange,
  groupId,
  bundle,
  onSuccess,
}: BundleManageDialogProps) {
  const { t } = useTranslation();
  const isEdit = !!bundle;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(bundle?.name || "");
      setDescription(bundle?.description || "");
    }
  }, [open, bundle]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("묶음 이름을 입력해주세요.");
      return;
    }

    try {
      setIsSaving(true);
      if (isEdit && bundle) {
        await updateGroupBookBundle(bundle.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
        toast.success(t("groups.bundleUpdated"));
      } else {
        await createGroupBookBundle(
          groupId,
          name.trim(),
          description.trim() || undefined
        );
        toast.success(t("groups.bundleCreated"));
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            {isEdit ? t("groups.editBundle") : t("groups.createBundle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("groups.bundleName")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("groups.bundleNamePlaceholder")}
              maxLength={200}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>{t("groups.bundleDescription")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("groups.bundleDescPlaceholder")}
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "저장 중..." : isEdit ? "수정" : "만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
