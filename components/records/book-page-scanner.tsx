"use client";

/**
 * BookPageScanner — 책 페이지 스캐너 (Tier 1 브라우저 전처리)
 *
 * vFlat 방식의 캡처 UX 를 웹앱(getUserMedia)으로 재현한다.
 *  - 라이브 후면 카메라 + 정렬 가이드 프레임
 *  - 촬영 시 jscanify(OpenCV.js)가 로드돼 있으면 테두리 자동 인식 + 원근 보정 크롭,
 *    아니면 원본 프레임 사용(graceful degrade)
 *  - 한 기록당 최대 maxPages(기본 3) 페이지 큐 — 페이지별 미리보기·삭제
 *  - getUserMedia 미지원/권한 거부 → file-input(capture) 폴백
 *
 * 결과는 onCapture(files) 로 상위에 전달한다. 업로드/OCR 은 상위가 담당.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ImagePlus, Loader2, ScanLine, X, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getDocumentScanner,
  cropDocument,
  canvasToFile,
  captureFrame,
  type DocumentScanner,
} from "@/lib/scan/document-scanner";

interface ScannedPage {
  file: File;
  url: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** 사용자가 "완료"하면 캡처된 페이지 파일들을 전달 */
  onCapture: (files: File[]) => void;
  maxPages?: number;
}

export function BookPageScanner({ open, onClose, onCapture, maxPages = 3 }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<DocumentScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [autoCropReady, setAutoCropReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pages, setPages] = useState<ScannedPage[]>([]);
  // 언마운트/닫기 시 object URL 정리를 위한 최신 pages 참조
  const pagesRef = useRef<ScannedPage[]>([]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraSupported(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraSupported(true);
      setCameraReady(true);
    } catch {
      // 권한 거부 / 카메라 없음 → 폴백
      setCameraSupported(false);
    }
  }, []);

  // open 토글에 따라 카메라/스캐너 라이프사이클 관리
  useEffect(() => {
    if (!open) return;
    setPages([]);
    setBusy(false);
    setAutoCropReady(false);
    setCameraSupported(true);
    void startCamera();
    // 스캐너(OpenCV+jscanify) 지연 로드 — 실패해도 무시(폴백 크롭 없음)
    void getDocumentScanner().then((s) => {
      scannerRef.current = s;
      setAutoCropReady(!!s);
    });
    return () => {
      stopCamera();
      pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [open, startCamera, stopCamera]);

  const addFiles = useCallback(
    (files: File[]) => {
      setPages((prev) => {
        const slots = Math.max(0, maxPages - prev.length);
        if (slots === 0) {
          toast.error(`최대 ${maxPages}페이지까지 스캔할 수 있어요.`);
          return prev;
        }
        const next = files.slice(0, slots).map((file) => ({
          file,
          url: URL.createObjectURL(file),
        }));
        return [...prev, ...next];
      });
    },
    [maxPages],
  );

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    if (pages.length >= maxPages) {
      toast.error(`최대 ${maxPages}페이지까지 스캔할 수 있어요.`);
      return;
    }
    setBusy(true);
    try {
      const frame = captureFrame(video);
      const cropped = cropDocument(frame, scannerRef.current) ?? frame;
      const file = await canvasToFile(cropped, `scan_${Date.now()}_${pages.length + 1}.jpg`);
      addFiles([file]);
    } catch {
      toast.error("촬영에 실패했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }, [cameraReady, pages.length, maxPages, addFiles]);

  const handleFileInput = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const imgs = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (imgs.length === 0) {
        toast.error("이미지 파일만 스캔할 수 있어요.");
        return;
      }
      addFiles(imgs);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles],
  );

  const handleRemove = useCallback((idx: number) => {
    setPages((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, i) => i !== idx);
    });
  }, []);

  const handleDone = useCallback(() => {
    if (pages.length === 0) {
      onClose();
      return;
    }
    onCapture(pages.map((p) => p.file));
    // object URL 정리는 상위 전달 후 — 파일 객체는 유효, URL 만 해제
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    setPages([]);
    onClose();
  }, [pages, onCapture, onClose]);

  const handleCancel = useCallback(() => {
    pages.forEach((p) => URL.revokeObjectURL(p.url));
    setPages([]);
    onClose();
  }, [pages, onClose]);

  if (!open || !mounted) return null;

  const canAddMore = pages.length < maxPages;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-black">
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-full p-2 hover:bg-white/10"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <ScanLine className="h-4 w-4 text-emerald-400" />
          페이지 스캔
          <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-xs">
            {pages.length}/{maxPages}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDone}
          disabled={pages.length === 0}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-emerald-300 disabled:text-white/30"
        >
          완료
        </button>
      </div>

      {/* 카메라 / 폴백 영역 */}
      <div className="relative flex-1 overflow-hidden">
        {cameraSupported ? (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* 정렬 가이드 프레임 */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="h-full w-full max-w-md rounded-lg border-2 border-dashed border-white/60" />
            </div>
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                카메라 준비 중…
              </div>
            )}
            {/* 자동 보정 상태 안내 */}
            <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/90">
              {autoCropReady ? "테두리 자동 보정 켜짐" : "가이드에 페이지를 맞춰 촬영하세요"}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center text-white">
            <Camera className="h-10 w-10 text-white/50" />
            <p className="text-sm text-white/80">
              카메라를 사용할 수 없어요.
              <br />
              앨범에서 책 페이지 사진을 선택해 스캔할 수 있어요.
            </p>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              사진 선택
            </Button>
          </div>
        )}
      </div>

      {/* 페이지 썸네일 큐 */}
      {pages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto bg-black/80 px-4 py-3">
          {pages.map((p, i) => (
            <div
              key={p.url}
              className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-white/20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`스캔 ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/70 p-0.5 text-white"
                aria-label={`${i + 1}페이지 삭제`}
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-0 left-0 bg-black/60 px-1 text-[10px] text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div className="flex items-center justify-center gap-6 bg-black px-4 pb-6 pt-3">
        {cameraSupported && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddMore}
            className="rounded-full p-3 text-white disabled:text-white/30"
            aria-label="앨범에서 추가"
          >
            <ImagePlus className="h-6 w-6" />
          </button>
        )}

        {cameraSupported && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={!cameraReady || !canAddMore || busy}
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40"
            aria-label="촬영"
          >
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            ) : (
              <Camera className="h-7 w-7 text-white" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleDone}
          disabled={pages.length === 0}
          className="flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          <Check className="h-4 w-4" />
          완료 ({pages.length})
        </button>
      </div>

      {/* 폴백 / 앨범 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFileInput(e.target.files)}
      />
    </div>,
    document.body,
  );
}
