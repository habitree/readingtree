"use client";

/**
 * 스탬프 단위 공유 다이얼로그.
 *
 * 진입점 3곳(/stamps 그리드, RecordSheet 종료/상세, 책 상세 ReadingTimeTab)이
 * useStampShareStore.openShare(logId)로 트리거. LazyOverlays에 마운트되어 lazy 청크.
 *
 * 채널: 링크 / 카드 이미지(클립보드·다운로드) / 카카오톡 / Web Share.
 * 비공개 스탬프는 링크/카카오 시점에 자동으로 is_public=true 토글.
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
import { downloadImage, isMobile } from "@/lib/utils/device";
import {
  copyShareLink,
  isKakaoShareAvailable,
  isNativeShareAvailable,
  shareViaKakao,
  shareViaNative,
} from "@/lib/share/share-channels";
import { getAppUrl } from "@/lib/utils/url";
import { useStampShareStore } from "@/hooks/use-stamp-share";
import { getStampForShare, setStampPublic, type StampShareData } from "@/app/actions/stamps/share";
import { StampShareCard } from "./stamp-share-card";

export function StampShareDialog() {
  const { isOpen, targetLogId, prefillBookTitle, close } = useStampShareStore();
  const [data, setData] = useState<StampShareData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [didCopy, setDidCopy] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // 다이얼로그 열릴 때 데이터 로드
  useEffect(() => {
    if (!isOpen || !targetLogId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    getStampForShare(targetLogId)
      .then((result) => {
        if (!cancelled) setData(result);
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
  }, [isOpen, targetLogId]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      close();
      // 닫힐 때 잠깐 후 상태 정리 (애니메이션 직후)
      setTimeout(() => {
        setData(null);
        setDidCopy(false);
      }, 200);
    }
  };

  const ensurePublic = async (): Promise<boolean> => {
    if (!targetLogId || !data) return false;
    if (data.isPublic) return true;
    setIsToggling(true);
    const res = await setStampPublic(targetLogId, true);
    setIsToggling(false);
    if (!res.success) {
      toast.error(res.error ?? "공개 설정에 실패했어요");
      return false;
    }
    setData({ ...data, isPublic: true });
    toast.success("스탬프를 공개로 전환했어요");
    return true;
  };

  const handleTogglePublic = async (next: boolean) => {
    if (!targetLogId || !data) return;
    setIsToggling(true);
    const res = await setStampPublic(targetLogId, next);
    setIsToggling(false);
    if (!res.success) {
      toast.error(res.error ?? "변경에 실패했어요");
      return;
    }
    setData({ ...data, isPublic: next });
    toast.success(next ? "공개로 전환됨" : "비공개로 전환됨");
  };

  const handleCopyLink = async () => {
    if (!targetLogId || !data) return;
    const ok = await ensurePublic();
    if (!ok) return;

    const baseUrl = getAppUrl();
    const url = `${baseUrl}/share/stamps/${targetLogId}`;
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
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;
      const target = captureRef.current;

      // 이미지 로딩 대기 (5초 timeout)
      const images = target.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const t = setTimeout(() => resolve(), 5000);
            img.onload = () => {
              clearTimeout(t);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(t);
              resolve();
            };
          });
        }),
      );

      const canvas = await html2canvas(target, {
        background: "#fafaf9", // stone-50
        useCORS: true,
        logging: false,
      });

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas to blob failed"));
        }, "image/png");
      });

      const filename = `readtree-stamp-${targetLogId}.png`;
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
      console.error("카드 캡처 실패:", err);
      toast.error("카드 생성에 실패했어요");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleKakao = async () => {
    if (!targetLogId || !data) return;
    const ok = await ensurePublic();
    if (!ok) return;

    const baseUrl = getAppUrl();
    const bookTitle = data.book?.title ?? prefillBookTitle ?? "독서 기록";
    const minutes = Math.round(data.durationSeconds / 60);
    const description = data.memo
      ? data.memo
      : `${minutes}분 · ${Math.max(0, (data.endPage ?? 0) - (data.startPage ?? 0))}페이지`;

    const success = await shareViaKakao({
      baseUrl,
      context: {
        kind: "stamp",
        id: targetLogId,
        title: bookTitle,
        description,
        path: `/share/stamps/${targetLogId}`,
        ctaLabel: "스탬프 보러가기",
      },
    });
    if (!success) {
      toast.error("카카오톡 공유를 사용할 수 없어요");
    }
  };

  const handleNativeShare = async () => {
    if (!targetLogId || !data) return;
    const ok = await ensurePublic();
    if (!ok) return;

    const baseUrl = getAppUrl();
    const bookTitle = data.book?.title ?? prefillBookTitle ?? "독서 기록";
    const minutes = Math.round(data.durationSeconds / 60);
    const description = data.memo
      ? data.memo
      : `${bookTitle} · ${minutes}분`;

    await shareViaNative({
      baseUrl,
      context: {
        kind: "stamp",
        id: targetLogId,
        title: bookTitle,
        description,
        path: `/share/stamps/${targetLogId}`,
      },
    });
  };

  const showNative = isNativeShareAvailable() && isMobile();
  const showKakao = isKakaoShareAvailable();

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-600" />
            스탬프 공유
          </DialogTitle>
          <DialogDescription>
            이 스탬프의 책·시간·메모를 카드로 만들어 친구와 공유해보세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 pb-5 pt-3">
          {/* 카드 미리보기 */}
          <div className="rounded-xl bg-stone-100/50 p-3">
            {isLoading ? (
              // 카드 실루엣 스켈레톤 — 로드 후 레이아웃과 맞춰 CLS/팝 방지
              <div className="flex aspect-[4/5] flex-col gap-3 rounded-lg bg-white p-4 dark:bg-stone-900">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-10 flex-shrink-0 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  </div>
                </div>
                <div className="flex-1 animate-pulse rounded-lg bg-stone-200 dark:bg-stone-800" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                  <div className="h-10 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
                </div>
              </div>
            ) : data ? (
              <StampShareCard data={data} captureRef={captureRef} />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center text-sm text-stone-500">
                스탬프를 불러올 수 없어요.
              </div>
            )}
          </div>

          {/* 공개 토글 */}
          {data && (
            <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2.5 dark:border-stone-800 dark:bg-stone-900/30">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-600" />
                <Label htmlFor="stamp-public-toggle" className="cursor-pointer text-sm">
                  공개
                  <span className="ml-1.5 text-[10px] text-stone-500">
                    {data.isPublic ? "링크 보유자가 볼 수 있어요" : "본인만 볼 수 있어요"}
                  </span>
                </Label>
              </div>
              <Switch
                id="stamp-public-toggle"
                checked={data.isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isToggling}
              />
            </div>
          )}

          {/* 채널 버튼들 */}
          {data && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                disabled={isToggling}
                className="h-12 justify-start gap-2"
              >
                {didCopy ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <LinkIcon className="h-4 w-4 text-emerald-600" />
                )}
                <span className="text-sm">링크 복사</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyCard}
                disabled={isCapturing}
                className="h-12 justify-start gap-2"
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-emerald-600" />
                )}
                <span className="text-sm">카드 이미지</span>
              </Button>

              {showKakao && (
                <Button
                  variant="outline"
                  onClick={handleKakao}
                  disabled={isToggling}
                  className="h-12 justify-start gap-2"
                >
                  <MessageCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">카카오톡</span>
                </Button>
              )}

              {showNative && (
                <Button
                  variant="outline"
                  onClick={handleNativeShare}
                  disabled={isToggling}
                  className="h-12 justify-start gap-2"
                >
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
