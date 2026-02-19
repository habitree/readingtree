"use client";

import { useState, useCallback } from "react";
import { Share2, Link2, Check, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateBookshelf } from "@/app/actions/bookshelves";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

interface BookshelfShareButtonProps {
  bookshelfId: string;
  bookshelfName: string;
  isPublic: boolean;
}

export function BookshelfShareButton({
  bookshelfId,
  bookshelfName,
  isPublic: initialIsPublic,
}: BookshelfShareButtonProps) {
  const { t } = useTranslation();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/bookshelves/${bookshelfId}`;

  const handleTogglePublic = useCallback(async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await updateBookshelf(bookshelfId, { is_public: checked });
      setIsPublic(checked);
      toast.success(checked ? t("bookshelves.madePublic") : t("bookshelves.madePrivate"));
    } catch (error) {
      console.error("서재 공개 설정 오류:", error);
      toast.error(t("bookshelves.shareSettingFailed"));
    } finally {
      setIsUpdating(false);
    }
  }, [bookshelfId]);

  const handleCopyLink = useCallback(async () => {
    if (!isPublic) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success(t("bookshelves.linkCopied"));
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error(t("bookshelves.linkCopyFailed"));
    }
  }, [isPublic, shareUrl]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3">
          <Share2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">{t("common.share")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("bookshelves.shareBookshelf")}</DialogTitle>
          <DialogDescription>
            {t("bookshelves.shareBookshelfDesc").replace("{name}", bookshelfName)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {/* 공개 토글 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="share-public-toggle" className="text-sm cursor-pointer">
                {isPublic ? t("bookshelves.publicStatus") : t("bookshelves.privateStatus")}
              </Label>
            </div>
            <Switch
              id="share-public-toggle"
              checked={isPublic}
              onCheckedChange={handleTogglePublic}
              disabled={isUpdating}
            />
          </div>

          {/* 링크 복사 */}
          {isPublic ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleCopyLink}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              {isCopied ? t("common.copied") : t("bookshelves.copyLink")}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              {t("bookshelves.enablePublicToShare")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
