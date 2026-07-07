/**
 * 클립보드 유틸리티 함수
 * 모바일 브라우저 호환성을 고려한 클립보드 복사 함수
 */

/**
 * 이미지를 클립보드에 복사하는 함수
 * 모바일 브라우저 호환성을 고려하여 여러 방법을 시도
 */
export async function copyImageToClipboard(
  blob: Blob,
  options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }
): Promise<boolean> {
  try {
    // Blob 타입을 명시적으로 "image/png"로 설정
    const imageBlob = new Blob([blob], { type: "image/png" });
    
    // ClipboardItem 생성 및 복사 시도
    const item = new ClipboardItem({ 
      "image/png": imageBlob 
    });
    
    await navigator.clipboard.write([item]);
    
    if (options?.onSuccess) {
      options.onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error("클립보드 복사 실패:", error);
    
    if (options?.onError) {
      options.onError(error instanceof Error ? error : new Error(String(error)));
    }
    
    return false;
  }
}

/**
 * 이미지 Blob "Promise"를 클립보드에 복사 — 사용자 제스처 동기 호출용.
 *
 * Safari/iOS 는 클릭 핸들러와 동기 시점에 clipboard.write 가 호출돼야 한다.
 * 캡처(html2canvas 등)가 오래 걸리면 제스처 컨텍스트가 만료되어 복사가 거부되므로,
 * ClipboardItem 에 Promise<Blob> 을 넘겨 쓰기를 즉시 시작하고 캡처를 기다리게 한다.
 *
 * 반환: 복사 성공 여부. 캡처 자체가 실패한 경우(원본 Promise reject)는 throw —
 * 호출부가 클립보드 미지원(다운로드 폴백)과 캡처 실패(에러 토스트)를 구분할 수 있다.
 */
export async function copyImagePromiseToClipboard(
  blobPromise: Promise<Blob>,
): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !("clipboard" in navigator) ||
    !("write" in navigator.clipboard) ||
    typeof ClipboardItem === "undefined"
  ) {
    await blobPromise; // 캡처 실패면 여기서 throw
    return false;
  }

  const pngPromise = blobPromise.then(
    (b) => new Blob([b], { type: "image/png" }),
  );
  try {
    const item = new ClipboardItem({ "image/png": pngPromise });
    await navigator.clipboard.write([item]);
    return true;
  } catch (error) {
    // 캡처 실패가 원인이면 그대로 전파, 클립보드 거부/미지원이면 false
    let captureFailed = false;
    let captureError: unknown = error;
    await pngPromise.catch((e) => {
      captureFailed = true;
      captureError = e;
    });
    if (captureFailed) throw captureError;
    console.error("클립보드 이미지 복사 실패:", error);
    return false;
  }
}

/**
 * HTML 리치 텍스트를 클립보드에 복사 (text/html + text/plain)
 * 네이버 블로그 에디터에서 서식 유지 붙여넣기 지원
 */
export async function copyHtmlToClipboard(
  html: string,
  plainText: string
): Promise<boolean> {
  // 1차: Clipboard API write (text/html + text/plain)
  if (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    "write" in navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  ) {
    try {
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plainText], { type: "text/plain" });
      const item = new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    } catch {
      // fallback으로 진행
    }
  }

  // 2차: contenteditable div + execCommand
  try {
    const container = document.createElement("div");
    container.setAttribute("contenteditable", "true");
    container.innerHTML = html;
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.opacity = "0";
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const success = document.execCommand("copy");
    document.body.removeChild(container);
    if (success) return true;
  } catch {
    // fallback으로 진행
  }

  // 3차: 평문 텍스트 복사
  try {
    await navigator.clipboard.writeText(plainText);
    return true;
  } catch {
    return false;
  }
}

/**
 * 모바일에서 클립보드 복사 지원 여부 확인
 */
export function isMobileClipboardSupported(): boolean {
  if (typeof window === "undefined") return false;
  
  // 모바일 브라우저 확인
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  if (!isMobileDevice) {
    // 데스크톱에서는 기본 Clipboard API 지원 확인
    return (
      typeof navigator !== "undefined" &&
      "clipboard" in navigator &&
      "write" in navigator.clipboard &&
      typeof ClipboardItem !== "undefined"
    );
  }
  
  // 모바일에서는 ClipboardItem 지원 여부 확인
  // iOS Safari 13.1+ 및 Android Chrome에서 지원
  return (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    "write" in navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  );
}
