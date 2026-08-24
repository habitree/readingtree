"use client";

/**
 * AI 리포트 → 이미지 카드 공유 다이얼로그
 *
 * 템플릿(5종)을 고르면 완성된 카드를 미리 보여주고,
 * html2canvas로 전체를 PNG로 떠서 클립보드 복사(네이버 블로그 붙여넣기용)
 * 또는 파일 저장을 제공한다.
 *
 * 캡처는 화면 밖(fixed left:-10000)에 800px 원본 크기로 렌더한 노드를 대상으로 한다
 * — 미리보기는 축소(zoom) 표시라 직접 캡처하면 해상도·크기가 어긋난다.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, ImageDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { captureElementToPngBlob } from "@/lib/utils/capture-card";
import { copyImagePromiseToClipboard } from "@/lib/utils/clipboard";
import { downloadImage } from "@/lib/utils/device";
import { buildShareCardData } from "./share-card-data";
import { ensureShareCardFonts } from "./share-card-fonts";
import { SHARE_CARD_TEMPLATES } from "./templates";
import type { BookInfoForReport } from "@/types/ai/report";

interface ShareCardDialogProps {
  reportMarkdown: string;
  bookInfo: BookInfoForReport;
  noteCount: number;
  noteTypeCounts: Record<string, number>;
  readingDays: number;
  generatedAt?: string;
  /** 생성 전 스타일 선택에서 고른 템플릿 — 다이얼로그 초기 선택값 */
  initialTemplateId?: string;
}

export function ShareCardDialog({
  reportMarkdown,
  bookInfo,
  noteCount,
  noteTypeCounts,
  readingDays,
  generatedAt,
  initialTemplateId,
}: ShareCardDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateId, setTemplateId] = useState(() =>
    initialTemplateId && SHARE_CARD_TEMPLATES.some((t) => t.id === initialTemplateId)
      ? initialTemplateId
      : SHARE_CARD_TEMPLATES[0].id
  );
  const [busy, setBusy] = useState<"copy" | "download" | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  // 다이얼로그는 포털로 늦게 마운트되므로 callback ref로 실제 노드를 잡아 관찰한다
  const [previewWrap, setPreviewWrap] = useState<HTMLDivElement | null>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

  const selected =
    SHARE_CARD_TEMPLATES.find((t) => t.id === templateId) ?? SHARE_CARD_TEMPLATES[0];

  const data = useMemo(
    () =>
      buildShareCardData({
        reportMarkdown,
        bookInfo,
        noteCount,
        noteTypeCounts,
        readingDays,
        generatedAt,
      }),
    [reportMarkdown, bookInfo, noteCount, noteTypeCounts, readingDays, generatedAt]
  );

  // 선택된 템플릿의 서체 온디맨드 로드
  useEffect(() => {
    if (open) ensureShareCardFonts(selected.fonts);
  }, [open, selected]);

  // 미리보기 축소 배율 (컨테이너 폭 / 800)
  useEffect(() => {
    if (!previewWrap) return;
    const update = () => setPreviewScale(Math.min(1, previewWrap.clientWidth / 800));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(previewWrap);
    return () => observer.disconnect();
  }, [previewWrap]);

  const handleCopy = () => {
    const node = captureRef.current;
    if (!node || busy) return;
    setBusy("copy");
    // Safari: 클릭 제스처와 동기 시점에 clipboard.write가 시작되어야 한다
    const blobPromise = captureElementToPngBlob(node, {
      targetWidth: 1600,
      backgroundColor: selected.captureBg,
    });
    copyImagePromiseToClipboard(blobPromise)
      .then(async (copied) => {
        if (copied) {
          toast.success("카드 이미지가 복사되었습니다. 블로그 본문에 붙여넣으세요.");
        } else {
          downloadImage(await blobPromise, `readtree-report-${selected.id}.png`);
          toast.info("이 브라우저는 이미지 복사를 지원하지 않아 파일로 저장했어요.");
        }
      })
      .catch(() => {
        toast.error("이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => setBusy(null));
  };

  const handleDownload = () => {
    const node = captureRef.current;
    if (!node || busy) return;
    setBusy("download");
    captureElementToPngBlob(node, { targetWidth: 1600, backgroundColor: selected.captureBg })
      .then((blob) => {
        downloadImage(blob, `readtree-report-${selected.id}.png`);
        toast.success("카드 이미지를 저장했습니다.");
      })
      .catch(() => {
        toast.error("이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      })
      .finally(() => setBusy(null));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageDown className="h-3.5 w-3.5 mr-1.5" />
          이미지 카드
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>이미지 카드로 공유</DialogTitle>
          <DialogDescription>
            템플릿을 고르면 완성된 카드 이미지를 복사해 네이버 블로그·SNS에 그대로 붙여넣을 수
            있어요.
          </DialogDescription>
        </DialogHeader>

        {/* 템플릿 선택 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {SHARE_CARD_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTemplateId(t.id)}
              className={cn(
                "rounded-md border p-2 text-left transition-colors",
                t.id === selected.id
                  ? "border-primary ring-1 ring-primary bg-primary/5"
                  : "hover:bg-muted/60"
              )}
            >
              <span
                className="block h-1.5 w-6 rounded-full mb-1.5"
                style={{ backgroundColor: t.captureBg }}
                aria-hidden
              />
              <span className="block text-xs font-medium leading-tight">{t.name}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground -mt-1">{selected.tagline}</p>

        {/* 미리보기 (축소) */}
        <div
          ref={setPreviewWrap}
          className="rounded-lg border bg-muted/30 overflow-auto max-h-[48vh] flex justify-center"
        >
          <div style={{ zoom: previewScale, width: 800, maxWidth: "none", flexShrink: 0 }}>
            <selected.Component data={data} />
          </div>
        </div>

        {/* 액션 */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={handleCopy} disabled={busy !== null}>
            {busy === "copy" ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-1.5" />
            )}
            이미지 복사
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownload}
            disabled={busy !== null}
          >
            {busy === "download" ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            PNG 저장
          </Button>
        </div>

        {/* 캡처용 원본 크기 렌더 (화면 밖) */}
        {open && (
          <div
            aria-hidden
            className="pointer-events-none"
            style={{
              position: "fixed",
              left: -10000,
              top: 0,
              width: 800,
              // 전역 max-width:100% 가 다이얼로그(680px) 기준으로 카드를 줄이는 것 방지
              maxWidth: "none",
              zIndex: -10,
            }}
          >
            <div ref={captureRef}>
              <selected.Component data={data} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
