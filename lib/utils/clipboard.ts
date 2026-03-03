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
 * 모바일에서 클립보드 복사 지원 여부 확인
 */
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
