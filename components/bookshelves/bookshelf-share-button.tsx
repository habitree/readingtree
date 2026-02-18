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
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/bookshelves/${bookshelfId}`;

  const handleTogglePublic = useCallback(async (checked: boolean) => {
    setIsUpdating(true);
    try {
      await updateBookshelf(bookshelfId, { is_public: checked });
      setIsPublic(checked);
      toast.success(checked ? "서재가 공개되었습니다" : "서재가 비공개로 변경되었습니다");
    } catch (error) {
      console.error("서재 공개 설정 오류:", error);
      toast.error("공개 설정 변경에 실패했습니다");
    } finally {
      setIsUpdating(false);
    }
  }, [bookshelfId]);

  const handleCopyLink = useCallback(async () => {
    if (!isPublic) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      toast.success("링크가 복사되었습니다");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  }, [isPublic, shareUrl]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 sm:w-auto sm:px-3">
          <Share2 className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">공유</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>서재 공유</DialogTitle>
          <DialogDescription>
            {bookshelfName} 서재를 링크로 공유할 수 있습니다.
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
                {isPublic ? "공개 중" : "비공개"}
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
              {isCopied ? "복사됨" : "링크 복사"}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              서재를 공개로 설정하면 링크를 공유할 수 있습니다.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
