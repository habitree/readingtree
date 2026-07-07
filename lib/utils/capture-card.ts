"use client";

/**
 * 공유 카드 DOM → PNG Blob 공통 캡처 유틸.
 *
 * simple-share-dialog(노트 공유)에서 검증된 안정화 파이프라인을 공용화한 것:
 *  1) document.fonts.ready — 폰트 로드 전 캡처 시 줄바꿈이 변해 하단이 잘리는 문제 방지
 *  2) 이미지 load + decode 대기 (타임아웃 5초) — 표지/사진이 빈칸으로 나오는 문제 방지
 *  3) rAF 2회 — 레이아웃 안정화
 *  4) 요소 실측 크기 기준 명시적 width/height/scale (기본 1080px 폭 출력)
 *     — 옵션 없이 캡처하면 화면 렌더 크기(≈380px) 그대로 저해상도로 나오거나
 *       스크롤 오프셋 때문에 카드가 잘려 나온다.
 *
 * 사용처: stamp-share-dialog, recap-share-dialog. (노트 공유는 자체 트리밍 로직 포함
 * 구현을 유지 — 카드 높이가 콘텐츠에 따라 크게 달라지는 특수 케이스.)
 */

export interface CaptureCardOptions {
  /** 출력 PNG 목표 폭(px). 기본 1080 */
  targetWidth?: number;
  /** 캡처 배경색(둥근 모서리 뒤 채움). 기본 흰색 */
  backgroundColor?: string;
}

type Html2CanvasFn = (
  element: HTMLElement,
  options?: Record<string, unknown>,
) => Promise<HTMLCanvasElement>;

export async function captureElementToPngBlob(
  target: HTMLElement,
  options: CaptureCardOptions = {},
): Promise<Blob> {
  const { targetWidth = 1080, backgroundColor = "#ffffff" } = options;

  // 1) 폰트 로드 대기 — 텍스트 레이아웃 확정
  await document.fonts.ready;

  // 2) 이미지 로드 + 디코딩 완료 보장
  await waitForImages(target);

  // 3) 렌더링 안정화 (rAF 2회)
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  // 4) 실측 크기 기준 캡처 — 스크롤/축소 상태와 무관하게 카드 전체를 담는다
  const rect = target.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const scale = targetWidth / width;

  const html2canvasModule = await import("html2canvas");
  // @types/html2canvas(0.5)와 v1 런타임 API가 어긋나 있어 시그니처를 직접 지정
  const html2canvas = html2canvasModule.default as unknown as Html2CanvasFn;

  const canvas = await html2canvas(target, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor,
    logging: false,
    imageTimeout: 15000,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    removeContainer: true,
    onclone: (_doc: Document, cloned: HTMLElement) => {
      cloned.style.transform = "none";
      cloned.querySelectorAll("img").forEach((img) => {
        if (!img.crossOrigin) img.crossOrigin = "anonymous";
      });
    },
  });

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b && b.size > 0) resolve(b);
      else reject(new Error("이미지 변환에 실패했습니다."));
    }, "image/png");
  });
}

/** 대상 내 모든 <img> load + decode 대기 (개별 5초 타임아웃, 실패해도 진행) */
async function waitForImages(target: HTMLElement): Promise<void> {
  const images = Array.from(target.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const finish = () => {
            img.decode().catch(() => {}).finally(resolve);
          };
          if (img.complete && img.naturalWidth > 0) {
            finish();
            return;
          }
          const t = setTimeout(() => resolve(), 5000);
          img.onload = () => {
            clearTimeout(t);
            finish();
          };
          img.onerror = () => {
            clearTimeout(t);
            resolve();
          };
        }),
    ),
  );
}
