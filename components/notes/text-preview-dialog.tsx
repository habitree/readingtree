"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, Save } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface TextPreviewDialogProps {
  title: string;
  content: string;
  label?: string;
  onSave?: (value: string) => void;
  maxLength?: number;
}

/**
 * 텍스트 미리보기 및 편집 다이얼로그 컴포넌트
 * 입력 중인 텍스트를 전체 화면으로 보고 수정할 수 있도록 함
 */
export function TextPreviewDialog({
  title,
  content,
  label,
  onSave,
  maxLength,
}: TextPreviewDialogProps) {
  const { t } = useTranslation();
  const resolvedLabel = label || t("notes.previewLabel");
  const [open, setOpen] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [hasChanges, setHasChanges] = useState(false);

  // 다이얼로그가 열릴 때마다 현재 content로 초기화
  useEffect(() => {
    if (open) {
      setEditedContent(content);
      setHasChanges(false);
    }
  }, [open, content]);

  // 내용이 변경되었는지 확인
  useEffect(() => {
    setHasChanges(editedContent !== content);
  }, [editedContent, content]);

  // 내용이 없으면 버튼 숨김
  if (!content || content.trim().length === 0) {
    return null;
  }

  const handleSave = () => {
    if (onSave) {
      onSave(editedContent);
      setHasChanges(false);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(content);
    setHasChanges(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          <Eye className="mr-1 h-3 w-3" />
          {resolvedLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("notes.contentEditDesc")}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 pt-4 overflow-y-auto">
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder={t("notes.contentPlaceholder")}
            className="min-h-[400px] resize-none text-sm whitespace-pre-wrap"
            maxLength={maxLength}
          />
          {maxLength && (
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {editedContent.length} / {maxLength}{t("notes.charSuffix")}
            </p>
          )}
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            {t("notes.cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            {t("notes.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

