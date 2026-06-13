/**
 * 문서 스캐너 유틸 (Tier 1 브라우저 전처리)
 *
 * vFlat 방식의 캡처 전처리(테두리 자동 인식 + 원근 보정)를 웹에서 재현하기 위한
 * OpenCV.js + jscanify 지연 로더와 크롭/파일 변환 헬퍼.
 *
 * 핵심 원칙: **항상 graceful degrade**.
 *  - CDN 로드 실패 / 미지원 브라우저 → getDocumentScanner() 가 null 을 반환하고,
 *    호출부는 원본 프레임(크롭 없이)으로 폴백한다. 절대 throw 로 UX 를 깨지 않는다.
 *  - ~8MB WASM 이므로 스캐너 진입 시점에만 로드(동적 import 대상 모듈).
 */

const OPENCV_URL = "https://docs.opencv.org/4.10.0/opencv.js";
const JSCANIFY_URL = "https://cdn.jsdelivr.net/npm/jscanify@1.3.0/src/jscanify.min.js";
const LOAD_TIMEOUT_MS = 15000;

/** jscanify 인스턴스의 우리가 쓰는 최소 표면 */
export interface DocumentScanner {
  /** 원근 보정 + 크롭된 캔버스를 반환. 내부적으로 종이 윤곽을 자동 검출한다. */
  extractPaper(
    image: HTMLCanvasElement | HTMLImageElement,
    resultWidth: number,
    resultHeight: number,
  ): HTMLCanvasElement;
  /** 검출된 종이 윤곽을 그린 캔버스를 반환(라이브 오버레이용, 선택). */
  highlightPaper(image: HTMLCanvasElement | HTMLImageElement): HTMLCanvasElement;
}

type DocumentScannerConstructor = new () => DocumentScanner;

interface OpenCvModule {
  Mat?: unknown;
  onRuntimeInitialized?: () => void;
}

declare global {
  interface Window {
    cv?: OpenCvModule;
    jscanify?: DocumentScannerConstructor;
  }
}

let scannerPromise: Promise<DocumentScanner | null> | null = null;

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("no document"));
      return;
    }
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`${id} load failed`)));
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    });
    script.addEventListener("error", () => reject(new Error(`${id} load failed`)));
    document.head.appendChild(script);
  });
}

function waitForOpenCvRuntime(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cv = window.cv;
    if (!cv) {
      reject(new Error("cv missing"));
      return;
    }
    if (cv.Mat) {
      resolve();
      return;
    }
    // 일부 빌드는 runtime 초기화 후 Mat 이 준비됨
    cv.onRuntimeInitialized = () => resolve();
    // 안전장치: 폴링(onRuntimeInitialized 가 호출되지 않는 빌드 대비)
    const started = Date.now();
    const timer = setInterval(() => {
      if (window.cv?.Mat) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > LOAD_TIMEOUT_MS) {
        clearInterval(timer);
        reject(new Error("cv runtime timeout"));
      }
    }, 200);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * 문서 스캐너(jscanify) 인스턴스를 지연 로드한다.
 * 실패하면 null 을 반환(호출부는 크롭 없이 폴백).
 * 결과는 모듈 레벨로 캐시되어 두 번째 호출부터 즉시 반환.
 */
export async function getDocumentScanner(): Promise<DocumentScanner | null> {
  if (typeof window === "undefined") return null;
  if (scannerPromise) return scannerPromise;

  scannerPromise = (async () => {
    try {
      await withTimeout(
        (async () => {
          await loadScript(OPENCV_URL, "opencv-js");
          await waitForOpenCvRuntime();
          await loadScript(JSCANIFY_URL, "jscanify-js");
        })(),
        LOAD_TIMEOUT_MS,
      );
      if (!window.jscanify) return null;
      return new window.jscanify();
    } catch {
      // 로드 실패 — 다음 호출에서 재시도할 수 있도록 캐시 해제
      scannerPromise = null;
      return null;
    }
  })();

  return scannerPromise;
}

/**
 * 소스(비디오 프레임 캔버스)에서 종이 영역을 원근 보정 크롭한다.
 * 검출 실패 시 null 반환 → 호출부는 원본 사용.
 */
export function cropDocument(
  source: HTMLCanvasElement,
  scanner: DocumentScanner | null,
  outputWidth = 1240,
): HTMLCanvasElement | null {
  if (!scanner) return null;
  try {
    const ratio = source.height / source.width || 1.414;
    const outputHeight = Math.round(outputWidth * ratio);
    const result = scanner.extractPaper(source, outputWidth, outputHeight);
    if (!result || result.width === 0 || result.height === 0) return null;
    return result;
  } catch {
    return null;
  }
}

/** 캔버스를 JPEG File 로 변환. */
export function canvasToFile(canvas: HTMLCanvasElement, fileName: string, quality = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("canvas toBlob 실패"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      quality,
    );
  });
}

/** 비디오 현재 프레임을 캔버스로 캡처. */
export function captureFrame(video: HTMLVideoElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 960;
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}
