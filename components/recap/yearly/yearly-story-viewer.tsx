"use client";

/**
 * 연간 독서 결산 스토리 뷰어 (REQ-0014).
 *
 * 좌우 탭·스와이프·방향키로 넘기는 9:16 슬라이드. 자동 넘김 없음.
 * 이미지 저장은 화면 밖 실제 크기(360×640) 노드를 1080×1920 으로 캡처한다
 * (화면에 보이는 슬라이드는 zoom 축소 상태라 캡처 대상으로 쓰지 않는다).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { captureElementToPngBlob } from "@/lib/utils/capture-card";
import { downloadImage, isMobile } from "@/lib/utils/device";
import { selectSlides, type YearlyRecapComputed } from "@/lib/recap/yearly";
import type { YearlyRecapShareInfo } from "@/app/actions/recap/yearly";
import { YearlySlide, SLIDE_HEIGHT, SLIDE_WIDTH } from "./yearly-slide";
import { YearlyShareActions } from "./yearly-share-actions";

const SWIPE_THRESHOLD = 40;

interface YearlyStoryViewerProps {
  computed: YearlyRecapComputed;
  userName: string | null;
  /** 본인 결산일 때만. 게스트·공개 페이지·빈 결산은 null */
  share: YearlyRecapShareInfo | null;
}

export function YearlyStoryViewer({ computed, userName, share }: YearlyStoryViewerProps) {
  const slides = useMemo(() => selectSlides(computed), [computed]);
  const [index, setIndex] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const captureRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);

  const last = slides.length - 1;
  const go = useCallback(
    (delta: number) => setIndex((i) => Math.min(last, Math.max(0, i + delta))),
    [last],
  );

  useEffect(() => {
    if (!stage) return;
    const update = () => setScale(stage.clientWidth / SLIDE_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (slides.length === 0) {
    return (
      <div className="mx-auto max-w-sm rounded-xl border p-8 text-center space-y-3">
        <p className="font-semibold">{computed.year}년 기록이 아직 없어요</p>
        <p className="text-sm text-muted-foreground">책을 읽고 기록을 남기면 결산이 만들어져요.</p>
        <Button asChild variant="outline">
          <Link href="/">홈으로</Link>
        </Button>
      </div>
    );
  }

  const slide = slides[index];

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const startX = pointerStartX.current;
    pointerStartX.current = null;
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1);
  };

  const handleSaveImage = async () => {
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const blob = await captureElementToPngBlob(captureRef.current, {
        targetWidth: 1080,
        backgroundColor: "#0E2A1F",
      });
      const filename = `habitree-${computed.year}-${index + 1}-${slide}.png`;

      // 모바일: 파일 공유 시트(인스타 스토리 등). 취소하면 그대로 종료.
      if (isMobile()) {
        const file = new File([blob], filename, { type: "image/png" });
        const nav = navigator as Navigator & {
          canShare?: (data: { files?: File[] }) => boolean;
          share?: (data: { files?: File[]; title?: string }) => Promise<void>;
        };
        if (nav.share && nav.canShare?.({ files: [file] })) {
          try {
            await nav.share({ files: [file], title: `${computed.year} 독서 결산` });
            return;
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") return;
          }
        }
      }
      downloadImage(blob, filename);
      toast.success("이미지를 저장했어요");
    } catch {
      toast.error("이미지를 만들지 못했어요. 다시 시도해 주세요.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    // 폭 상한을 뷰포트 높이에서 역산해 슬라이드와 조작 버튼이 한 화면에 들어오게 한다.
    <div
      className="mx-auto flex w-full flex-col gap-3"
      style={{ maxWidth: "max(260px, min(420px, calc((100dvh - 340px) * 0.5625)))" }}
    >
      <div className="flex gap-1" aria-hidden>
        {slides.map((key, i) => (
          <span
            key={key}
            className={`h-1 flex-1 rounded-full ${i <= index ? "bg-foreground" : "bg-foreground/20"}`}
          />
        ))}
      </div>

      <div
        ref={setStage}
        role="group"
        aria-roledescription="슬라이드"
        aria-label={`${computed.year} 독서 결산 ${index + 1} / ${slides.length}`}
        className="relative w-full cursor-pointer select-none overflow-hidden rounded-2xl touch-pan-y"
        style={{ aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}` }}
        onPointerDown={(e) => {
          pointerStartX.current = e.clientX;
        }}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ zoom: scale, width: SLIDE_WIDTH, maxWidth: "none" }}>
              <YearlySlide slide={slide} computed={computed} userName={userName} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => go(-1)} disabled={index === 0}>
            이전
          </Button>
          <Button variant="outline" size="sm" onClick={() => go(1)} disabled={index === last}>
            다음
          </Button>
        </div>
        <Button size="sm" onClick={handleSaveImage} disabled={isCapturing}>
          {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          이미지 저장
        </Button>
      </div>

      {share && <YearlyShareActions computed={computed} userName={userName} share={share} />}

      {/* 캡처 전용 노드 — 화면 밖 실제 크기. 전역 max-width:100% 를 끊어야 축소되지 않는다. */}
      <div
        aria-hidden
        style={{ position: "fixed", left: -10000, top: 0, width: SLIDE_WIDTH, maxWidth: "none", pointerEvents: "none" }}
      >
        <div ref={captureRef} style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, maxWidth: "none" }}>
          <YearlySlide slide={slide} computed={computed} userName={userName} />
        </div>
      </div>
    </div>
  );
}
