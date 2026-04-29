"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { copyImageToClipboard } from "@/lib/utils/clipboard";
import { downloadImage, isMobile } from "@/lib/utils/device";
import { StampPreviewCard } from "./stamp-preview-card";
import type { ReadingStamp } from "@/types/progress";
import { cn } from "@/lib/utils";

interface StampShareButtonProps {
  stamp: ReadingStamp;
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

/**
 * 스탬프 공유 버튼.
 * - html2canvas 로 1080x1080 PNG 캡처
 * - 클립보드 복사 시도, 실패 시 다운로드 fallback
 * - 캡처용 카드는 hidden absolute 위치에 렌더 (사용자 화면에 안 보임)
 */
export function StampShareButton({
  stamp,
  className,
  variant = "outline",
}: StampShareButtonProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      // html2canvas 동적 import (번들 최적화)
      const html2canvasModule = await import("html2canvas");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const html2canvas = html2canvasModule.default as any;

      const target = captureRef.current;

      // 이미지 로딩 대기
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

      const isMobileDevice = isMobile();
      // 렌더 안정화 대기
      await new Promise((r) => setTimeout(r, isMobileDevice ? 1200 : 800));

      const CARD_SIZE = 540; // 화면 표시 사이즈
      const TARGET_SIZE = 1080; // 출력 사이즈 (인스타 정사각)
      const scale = TARGET_SIZE / CARD_SIZE;

      const canvas = await html2canvas(target, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: isMobileDevice ? 20000 : 15000,
        windowWidth: CARD_SIZE,
        windowHeight: CARD_SIZE,
        width: CARD_SIZE,
        height: CARD_SIZE,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b: Blob | null) =>
            b && b.size > 0 ? resolve(b) : reject(new Error("이미지 변환 실패")),
          "image/png",
        );
      });

      // 클립보드 우선
      const clipboardOk = await copyImageToClipboard(blob, {
        onSuccess: () => {
          setCopied(true);
          toast.success("스탬프 카드를 복사했어요. 인스타·카카오에 붙여넣기 해보세요.");
          setTimeout(() => setCopied(false), 2500);
        },
        onError: () => {
          // fallback 처리는 아래
        },
      });

      if (!clipboardOk) {
        const filename = `readtree-stamp-${stamp.id}-${Date.now()}.png`;
        downloadImage(blob, filename);
        setCopied(true);
        toast.success("스탬프 이미지를 다운로드했어요.");
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("스탬프 공유 실패:", err);
      toast.error("공유에 실패했어요. 다시 시도해주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      {/* 캡처 전용 hidden 카드 (절대 위치, 화면 밖) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-[9999px] top-0 opacity-0"
      >
        <div style={{ width: 540, height: 540 }}>
          <StampPreviewCard
            captureRef={captureRef}
            imageUrl={stamp.image_url ?? undefined}
            bookTitle={stamp.book?.title ?? null}
            bookAuthor={stamp.book?.author ?? null}
            coverImageUrl={stamp.book?.cover_image_url ?? null}
            startPage={stamp.start_page ?? 0}
            endPage={stamp.end_page ?? stamp.page_number ?? 0}
            durationSeconds={stamp.reading_duration_seconds ?? 0}
            date={new Date(stamp.created_at)}
          />
        </div>
      </div>

      <Button
        type="button"
        variant={variant}
        onClick={handleShare}
        disabled={isCapturing}
        className={cn(className)}
      >
        {isCapturing ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            준비 중...
          </>
        ) : copied ? (
          <>
            <Check className="mr-1 h-4 w-4" />
            복사됨
          </>
        ) : (
          <>
            <Share2 className="mr-1 h-4 w-4" />
            공유하기
          </>
        )}
      </Button>
    </>
  );
}
