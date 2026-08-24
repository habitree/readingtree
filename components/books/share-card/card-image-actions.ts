"use client";

/**
 * 카드 이미지 복사/저장 공용 액션
 * (share-card-dialog의 검증된 파이프라인을 report-share-dialog와 공유)
 *
 * Safari 주의: 클릭 핸들러에서 이 함수를 동기 호출해야 한다 —
 * 캡처 Promise를 만든 직후 clipboard.write가 제스처 컨텍스트 안에서 시작된다.
 */

import { captureElementToPngBlob } from "@/lib/utils/capture-card";
import { copyImagePromiseToClipboard } from "@/lib/utils/clipboard";
import { downloadImage } from "@/lib/utils/device";
import type { ShareCardTemplateDef } from "./templates/types";

const CAPTURE_WIDTH = 1600;

function fileName(template: ShareCardTemplateDef): string {
  return `readtree-report-${template.id}.png`;
}

/** 카드 노드를 PNG로 떠서 클립보드에 복사. 미지원 브라우저는 파일 저장 폴백 */
export async function copyCardImageWithFallback(
  node: HTMLElement,
  template: ShareCardTemplateDef
): Promise<"copied" | "downloaded"> {
  const blobPromise = captureElementToPngBlob(node, {
    targetWidth: CAPTURE_WIDTH,
    backgroundColor: template.captureBg,
  });
  const copied = await copyImagePromiseToClipboard(blobPromise);
  if (copied) return "copied";
  downloadImage(await blobPromise, fileName(template));
  return "downloaded";
}

/** 카드 노드를 PNG 파일로 저장 */
export async function downloadCardImage(
  node: HTMLElement,
  template: ShareCardTemplateDef
): Promise<void> {
  const blob = await captureElementToPngBlob(node, {
    targetWidth: CAPTURE_WIDTH,
    backgroundColor: template.captureBg,
  });
  downloadImage(blob, fileName(template));
}
