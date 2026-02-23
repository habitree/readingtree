"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Save,
  Check,
  Link as LinkIcon,
  Globe,
  Loader2,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  saveReadingReport,
  toggleReportPublic,
} from "@/app/actions/ai/report";
import { loadKakaoSdk, isKakaoShareAvailable } from "@/lib/kakao/sdk";
import { HighlightCardDownload } from "@/components/share/highlight-card-download";
import type { BookInfoForReport } from "@/types/ai/report";

interface ReportShareDialogProps {
  userBookId: string;
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteIds: string[];
}

export function ReportShareDialog({
  userBookId,
  reportMarkdown,
  bookInfo,
  noteCount,
  noteIds,
}: ReportShareDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [kakaoShared, setKakaoShared] = useState(false);

  // 저장
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveReadingReport(
        userBookId,
        reportMarkdown,
        bookInfo,
        noteCount,
        noteIds
      );
      if (result.success && result.shareId) {
        setShareId(result.shareId);
        toast.success(t("books.aiReportSaved"));
      } else {
        const errMsg = result.error || t("books.aiReportError");
        // DB 스키마 미적용 오류를 사용자 친화적으로 변환
        const isSchemaError = errMsg.includes("does not exist") || errMsg.includes("column");
        toast.error(
          isSchemaError
            ? "서버 설정을 업데이트 중이에요. 잠시 후 다시 시도해 주세요."
            : errMsg,
          { duration: 5000 }
        );
      }
    } catch {
      toast.error(t("books.aiReportError"));
    } finally {
      setIsSaving(false);
    }
  };

  // 공개 토글
  const handleTogglePublic = async (checked: boolean) => {
    if (!shareId) return;
    const result = await toggleReportPublic(shareId, checked, includeNotes);
    if (result.success) {
      setIsPublic(checked);
      toast.success(
        checked ? t("books.aiReportMadePublic") : t("books.aiReportMadePrivate")
      );
    } else {
      toast.error(result.error || t("books.aiReportError"));
    }
  };

  // 기록 함께 공유 토글
  const handleToggleIncludeNotes = async (checked: boolean) => {
    setIncludeNotes(checked);
    // 이미 공개 상태면 즉시 반영
    if (shareId && isPublic) {
      const result = await toggleReportPublic(shareId, true, checked);
      if (!result.success) {
        toast.error(result.error || t("books.aiReportError"));
        setIncludeNotes(!checked); // rollback
      }
    }
  };

  // 링크 복사
  const handleCopyLink = async () => {
    if (!shareId || !isPublic) {
      toast.error(t("books.aiReportMakePublicFirst"));
      return;
    }
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${baseUrl}/share/reports/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast.success(t("books.aiReportLinkCopied"));
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error(t("common.retry"));
    }
  };

  // 카카오 공유
  const showKakao = isKakaoShareAvailable();
  const handleKakaoShare = useCallback(async () => {
    if (!shareId || !isPublic) {
      toast.error(t("books.aiReportMakePublicFirst"));
      return;
    }
    try {
      const kakao = await loadKakaoSdk();
      if (!kakao) {
        toast.error(t("common.retry"));
        return;
      }
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const shareUrl = `${baseUrl}/share/reports/${shareId}`;
      const ogImageUrl = `${baseUrl}/share/reports/${shareId}/opengraph-image`;

      kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `AI 독서 리포트 - ${bookInfo.title}`,
          description: `${bookInfo.author || ""} | 기록 ${noteCount}개 기반 AI 분석`,
          imageUrl: ogImageUrl,
          imageWidth: 1200,
          imageHeight: 630,
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
        buttons: [
          {
            title: "리포트 보기",
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
        ],
      });
      setKakaoShared(true);
      setTimeout(() => setKakaoShared(false), 2000);
    } catch {
      toast.error(t("common.retry"));
    }
  }, [shareId, isPublic, bookInfo, noteCount, t]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5">
          <Save className="h-3.5 w-3.5" />
          {t("books.aiReportSaveShare")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("books.aiReportShare")}</DialogTitle>
          <DialogDescription>
            {t("books.aiReportShareDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {/* 저장 상태 */}
          {!shareId ? (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? t("common.loading") : t("books.aiReportSaveShare")}
            </Button>
          ) : (
            <>
              {/* 저장 완료 배지 */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t("books.aiReportSaved")}
                </span>
              </div>

              {/* 공개 토글 */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label
                  htmlFor="report-public-toggle"
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {t("books.aiReportMakePublic")}
                </Label>
                <Switch
                  id="report-public-toggle"
                  checked={isPublic}
                  onCheckedChange={handleTogglePublic}
                />
              </div>

              {/* 기록도 함께 공유 토글 */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40">
                <Label
                  htmlFor="include-notes-toggle"
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <StickyNote className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {t("books.aiReportIncludeNotes")}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({noteIds.length}개)
                    </span>
                  </span>
                </Label>
                <Switch
                  id="include-notes-toggle"
                  checked={includeNotes}
                  onCheckedChange={handleToggleIncludeNotes}
                />
              </div>

              {/* 링크 복사 */}
              <Button
                onClick={handleCopyLink}
                variant={linkCopied ? "success" : "outline"}
                disabled={!isPublic}
                className="w-full gap-2"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t("books.aiReportLinkCopied")}
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    {t("books.aiReportCopyLink")}
                  </>
                )}
              </Button>

              {/* 카카오 공유 */}
              {showKakao && (
                <Button
                  onClick={handleKakaoShare}
                  variant={kakaoShared ? "success" : "kakao"}
                  disabled={!isPublic}
                  className="w-full gap-2"
                >
                  {kakaoShared ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t("share.shareDone")}
                    </>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 0C4.03 0 0 3.27 0 7.3c0 2.55 1.7 4.8 4.25 6.05L3.5 17.5l4.5-2.45c.5.05 1 .1 1.5.1 4.97 0 9-3.27 9-7.3S13.97 0 9 0z"
                          fill="#3C1E1E"
                        />
                      </svg>
                      {t("share.kakaoShare")}
                    </>
                  )}
                </Button>
              )}

              {/* 카드 다운로드 (공개 상태일 때만) */}
              {isPublic && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground mb-2">인스타그램 공유용 이미지 카드</p>
                  <HighlightCardDownload
                    shareId={shareId}
                    bookTitle={bookInfo.title}
                  />
                </div>
              )}

              {/* 비공개 안내 */}
              {!isPublic && (
                <p className="text-xs text-muted-foreground text-center">
                  {t("books.aiReportMakePublicFirst")}
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
