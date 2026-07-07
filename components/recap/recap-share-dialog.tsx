"use client";

/**
 * 월간 독서결산 공유 다이얼로그 (스탬프 stamp-share-dialog 미러).
 *
 * RecapView/RecapSection의 "공유" 버튼이 useRecapShareStore.openShare(shareId)로 트리거.
 * LazyOverlays에 마운트되어 lazy 청크.
 *
 * 채널: 링크 / 카드 이미지 / 카카오톡 / X / Web Share.
 * 비공개 결산은 링크·카카오·X 시점에 자동으로 is_public=true 토글.
 */

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, LinkIcon, ImageIcon, MessageCircle, Share2, Check, Globe } from "lucide-react";
import { toast } from "sonner";
import { copyImageToClipboard } from "@/lib/utils/clipboard";
import { captureElementToPngBlob } from "@/lib/utils/capture-card";
import { downloadImage, isMobile } from "@/lib/utils/device";
import {
  copyShareLink,
  isKakaoShareAvailable,
  isNativeShareAvailable,
  shareViaKakao,
  shareViaNative,
  shareViaX,
  type ShareContext,
} from "@/lib/share/share-channels";
import { getAppUrl } from "@/lib/utils/url";
import { useRecapShareStore } from "@/hooks/use-recap-share";
import { getRecapForShare, setRecapPublic, getRecapAiCaption } from "@/app/actions/recap/share";
import type { RecapShareData } from "@/app/actions/recap/types";
import { RecapShareCard } from "./recap-share-card";

export function RecapShareDialog() {
  const { isOpen, targetShareId, close } = useRecapShareStore();
  const [data, setData] = useState<RecapShareData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [didCopy, setDidCopy] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !targetShareId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getRecapForShare(targetShareId)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        // AI 한줄평 지연 로드
        if (result && !result.aiCaption) {
          getRecapAiCaption(targetShareId)
            .then((caption) => {
              if (!cancelled && caption) {
                setData((prev) => (prev ? { ...prev, aiCaption: caption } : prev));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetShareId]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      close();
      setTimeout(() => {
        setData(null);
        setDidCopy(false);
      }, 200);
    }
  };

  const ensurePublic = async (): Promise<boolean> => {
    if (!targetShareId || !data) return false;
    if (data.isPublic) return true;
    setIsToggling(true);
    const res = await setRecapPublic(targetShareId, true);
    setIsToggling(false);
    if (!res.success) {
      toast.error(res.error ?? "공개 설정에 실패했어요");
      return false;
    }
    setData({ ...data, isPublic: true });
    toast.success("결산을 공개로 전환했어요");
    return true;
  };

  const handleTogglePublic = async (next: boolean) => {
    if (!targetShareId || !data) return;
    setIsToggling(true);
    const res = await setRecapPublic(targetShareId, next);
    setIsToggling(false);
    if (!res.success) {
      toast.error(res.error ?? "변경에 실패했어요");
      return;
    }
    setData({ ...data, isPublic: next });
    toast.success(next ? "공개로 전환됨" : "비공개로 전환됨");
  };

  const shareContext = (): ShareContext | null => {
    if (!data) return null;
    const persona = data.highlights.personaTitle;
    return {
      kind: "recap",
      id: data.shareId,
      title: `${data.profile?.name ? data.profile.name + "님의 " : ""}${data.year}년 ${data.month}월 독서결산`,
      description: `${persona} · 완독 ${data.stats.completedBooks}권 · 기록 ${data.stats.totalNotes}개`,
      path: `/share/recaps/${data.shareId}`,
      ctaLabel: "결산 보러가기",
    };
  };

  const handleCopyLink = async () => {
    if (!data) return;
    const ok = await ensurePublic();
    if (!ok) return;
    const url = `${getAppUrl()}/share/recaps/${data.shareId}`;
    const success = await copyShareLink(url);
    if (success) {
      setDidCopy(true);
      toast.success("링크를 복사했어요");
      setTimeout(() => setDidCopy(false), 2000);
    } else {
      toast.error("링크 복사에 실패했어요");
    }
  };

  const handleCopyCard = async () => {
    if (!captureRef.current || isCapturing || !data) return;
    setIsCapturing(true);
    try {
      // 공통 캡처 유틸 — 폰트/이미지 대기 + 1080px 폭 고해상도 + 스크롤 잘림 방지
      const blob = await captureElementToPngBlob(captureRef.current, {
        backgroundColor: "#fafaf9", // stone-50
      });

      const filename = `readtree-recap-${data.year}-${data.month}.png`;
      const copied = await copyImageToClipboard(blob);
      if (copied) {
        setDidCopy(true);
        toast.success("카드를 클립보드에 복사했어요");
        setTimeout(() => setDidCopy(false), 2000);
      } else {
        downloadImage(blob, filename);
        toast.success("카드를 다운로드했어요");
      }
    } catch (err) {
      console.error("결산 카드 캡처 실패:", err);
      toast.error("카드 생성에 실패했어요");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleKakao = async () => {
    const ctx = shareContext();
    if (!ctx || !data) return;
    const ok = await ensurePublic();
    if (!ok) return;
    const success = await shareViaKakao({ baseUrl: getAppUrl(), context: ctx, version: data.shareVersion });
    if (!success) toast.error("카카오톡 공유를 사용할 수 없어요");
  };

  const handleX = async () => {
    const ctx = shareContext();
    if (!ctx || !data) return;
    const ok = await ensurePublic();
    if (!ok) return;
    shareViaX({ baseUrl: getAppUrl(), context: ctx, version: data.shareVersion });
  };

  const handleNativeShare = async () => {
    const ctx = shareContext();
    if (!ctx || !data) return;
    const ok = await ensurePublic();
    if (!ok) return;
    await shareViaNative({ baseUrl: getAppUrl(), context: ctx, version: data.shareVersion });
  };

  const showNative = isNativeShareAvailable() && isMobile();
  const showKakao = isKakaoShareAvailable();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            월간 독서결산 공유
          </DialogTitle>
          <DialogDescription>
            이번 달 독서를 카드로 만들어 친구와 공유해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 pb-5 pt-3">
          {/* 카드 미리보기 */}
          <div className="rounded-xl bg-stone-100/50 p-3">
            {isLoading ? (
              <div className="flex aspect-[4/5] flex-col gap-3 rounded-lg bg-white p-4 dark:bg-stone-900">
                <div className="h-16 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                <div className="flex gap-2">
                  <div className="h-20 w-14 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-20 w-14 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-12 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-12 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                </div>
              </div>
            ) : data ? (
              <RecapShareCard data={data} captureRef={captureRef} />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-stone-500">
                결산을 불러올 수 없어요.
              </div>
            )}
          </div>

          {/* 공개 토글 */}
          {data && (
            <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5 dark:border-stone-800 dark:bg-stone-900/30">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                <Label htmlFor="recap-public-toggle" className="cursor-pointer text-sm">
                  공개
                  <span className="ml-1.5 text-[10px] text-stone-500">
                    {data.isPublic ? "링크 보유자가 볼 수 있어요" : "본인만 볼 수 있어요"}
                  </span>
                </Label>
              </div>
              <Switch
                id="recap-public-toggle"
                checked={data.isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isToggling}
              />
            </div>
          )}

          {/* 채널 버튼 */}
          {data && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleCopyLink} disabled={isToggling} className="h-12 justify-start gap-2">
                {didCopy ? <Check className="h-4 w-4 text-emerald-600" /> : <LinkIcon className="h-4 w-4 text-emerald-600" />}
                <span className="text-sm">링크 복사</span>
              </Button>

              <Button variant="outline" onClick={handleCopyCard} disabled={isCapturing} className="h-12 justify-start gap-2">
                {isCapturing ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <ImageIcon className="h-4 w-4 text-emerald-600" />}
                <span className="text-sm">카드 이미지</span>
              </Button>

              {showKakao && (
                <Button variant="outline" onClick={handleKakao} disabled={isToggling} className="h-12 justify-start gap-2">
                  <MessageCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">카카오톡</span>
                </Button>
              )}

              <Button variant="outline" onClick={handleX} disabled={isToggling} className="h-12 justify-start gap-2">
                <span className="flex h-4 w-4 items-center justify-center text-sm font-bold">𝕏</span>
                <span className="text-sm">X (트위터)</span>
              </Button>

              {showNative && (
                <Button variant="outline" onClick={handleNativeShare} disabled={isToggling} className="h-12 justify-start gap-2">
                  <Share2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">다른 앱</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
