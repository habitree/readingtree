"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Link2, X } from "lucide-react";
import { parseBookLinks } from "@/lib/utils/book-link";
import { updateNote } from "@/app/actions/notes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

interface BookLinkManagerProps {
  noteId: string;
  content: string;
  onUpdate?: () => void;
}

/**
 * 기록 내용에서 유효하지 않은 책 링크를 관리하는 컴포넌트
 * 삭제된 책 링크를 제거하거나 재설정할 수 있음
 */
export function BookLinkManager({ noteId, content, onUpdate }: BookLinkManagerProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const bookLinks = parseBookLinks(content);
  const hasLinks = bookLinks.length > 0;

  if (!hasLinks) {
    return null;
  }

  const handleRemoveAllLinks = async () => {
    if (!confirm(t("notes.confirmRemoveLinks"))) {
      return;
    }

    setIsUpdating(true);
    try {
      // 모든 책 링크를 제목만으로 변환
      let newContent = content;
      bookLinks.forEach((link) => {
        const linkPattern = `[${link.text}](@book:${link.userBookId})`;
        newContent = newContent.replace(linkPattern, link.text);
      });

      // 기존 content 파싱
      const { parseNoteContentFields } = await import("@/lib/utils/note");
      const { quote, memo } = parseNoteContentFields(content);
      
      // quote와 memo에서 링크 제거
      let newQuote = quote || "";
      let newMemo = memo || "";
      
      bookLinks.forEach((link) => {
        const linkPattern = `[${link.text}](@book:${link.userBookId})`;
        newQuote = newQuote.replace(linkPattern, link.text);
        newMemo = newMemo.replace(linkPattern, link.text);
      });

      // quote_content와 memo_content로 업데이트
      await updateNote(noteId, {
        quote_content: newQuote.trim() || undefined,
        memo_content: newMemo.trim() || undefined,
      });

      toast.success(t("notes.bookLinksRemoved"));
      setOpen(false);
      if (onUpdate) {
        onUpdate();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("책 링크 제거 오류:", error);
      toast.error(t("notes.bookLinksRemoveFailed"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Link2 className="w-4 h-4" />
          {t("notes.bookLinkManage")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("notes.bookLinkManage")}</DialogTitle>
          <DialogDescription>
            {t("notes.bookLinkManageDesc")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("notes.bookLinkCountAlert", { count: bookLinks.length })}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t("notes.includedBookLinks")}</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {bookLinks.map((link, index) => (
                <li key={index}>{link.text}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleRemoveAllLinks}
              disabled={isUpdating}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              {t("notes.removeAllLinks")}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setOpen(false);
                router.push(`/notes/${noteId}/edit`);
              }}
            >
              {t("notes.goToEditPage")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
