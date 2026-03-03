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
  Share2,
  Check,
  Link as LinkIcon,
  Globe,
  Loader2,
  StickyNote,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import {
  saveReadingReport,
  toggleReportPublic,
} from "@/app/actions/ai/report";
import { loadKakaoSdk, isKakaoShareAvailable } from "@/lib/kakao/sdk";
import { buildBlogHtml, buildBlogPlainText } from "@/lib/utils/blog-html-builder";
import { copyHtmlToClipboard } from "@/lib/utils/clipboard";
import type { BookInfoForReport, NoteSummary } from "@/types/ai/report";

interface ReportShareDialogProps {
  userBookId: string;
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteIds: string[];
  noteSummaries?: NoteSummary[];
  generatedAt?: string;
  /** 이미 저장된 경우 초기 shareId */
  initialShareId?: string | null;
  onSaved?: (shareId: string) => void;
}

export function ReportShareDialog({
  userBookId,
  reportMarkdown,
  bookInfo,
  noteCount,
  noteIds,
  noteSummaries,
  generatedAt,
  initialShareId,
  onSaved,
}: ReportShareDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [shareId, setShareId] = useState<string | null>(initialShareId ?? null);
  const [isPublic, setIsPublic] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [blogCopied, setBlogCopied] = useState(false);
  const [kakaoShared, setKakaoShared] = useState(false);

  // 다이얼로그 열릴 때 미저장이면 자동 저장
  const handleOpenChange = async (next: boolean) => {
    if (next && !shareId) {
      setOpen(true);
      setIsAutoSaving(true);
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
          onSaved?.(result.shareId);
        } else {
          const errMsg = result.error ?? "";
          const isSchemaError = errMsg.includes("does not exist") || errMsg.includes("column");
          toast.error(
            isSchemaError
              ? "서버 설정을 업데이트 중이에요. 잠시 후 다시 시도해 주세요."
              : errMsg || "저장 중 오류가 발생했습니다.",
            { duration: 5000 }
          );
          setOpen(false);
        }
      } catch {
        toast.error("저장 중 오류가 발생했습니다.");
        setOpen(false);
      } finally {
        setIsAutoSaving(false);
      }
    } else {
      setOpen(next);
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
    if (shareId && isPublic) {
      const result = await toggleReportPublic(shareId, true, checked);
      if (!result.success) {
        toast.error(result.error || t("books.aiReportError"));
        setIncludeNotes(!checked);
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

  // 블로그용 복사
  const handleBlogCopy = useCallback(async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const blogOptions = {
      reportMarkdown,
      bookInfo,
      noteCount,
      noteSummaries,
      includeNotes,
      generatedAt,
      baseUrl: origin,
      shareId,
    };
    const html = buildBlogHtml(blogOptions);
    const plain = buildBlogPlainText(blogOptions);
    const success = await copyHtmlToClipboard(html, plain);
    if (success) {
      setBlogCopied(true);
      toast.success(t("books.blogCopyToast"));
      setTimeout(() => setBlogCopied(false), 2000);
    } else {
      toast.error(t("common.retry"));
    }
  }, [reportMarkdown, bookInfo, noteCount, noteSummaries, includeNotes, generatedAt, shareId, t]);

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-1.5" disabled={isAutoSaving}>
          {isAutoSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {isAutoSaving ? "저장 중..." : "공유"}
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

          {/* 블로그용 복사 */}
          <Button
            onClick={handleBlogCopy}
            variant={blogCopied ? "success" : "outline"}
            className="w-full gap-2"
          >
            {blogCopied ? (
              <>
                <Check className="h-4 w-4" />
                {t("books.blogCopied")}
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                {t("books.blogCopy")}
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

          {/* 비공개 안내 */}
          {!isPublic && (
            <p className="text-xs text-muted-foreground text-center">
              {t("books.aiReportMakePublicFirst")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
