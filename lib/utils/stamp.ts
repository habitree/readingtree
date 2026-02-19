/**
 * 이미지에 스탬프(타임스탬프)를 추가하는 유틸리티 함수
 */

/**
 * 이미지 파일에 타임스탬프 스탬프를 추가
 * @param file 원본 이미지 파일
 * @param timestamp 타임스탬프 (기본값: 현재 시간)
 * @returns 스탬프가 추가된 Blob
 */
export async function addStampToImage(
  file: File,
  timestamp?: Date
): Promise<Blob> {
  const targetTimestamp = timestamp || new Date();
  
  // 이미지 로드
  const img = new Image();
  const imageUrl = URL.createObjectURL(file);
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Canvas 생성
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Canvas context를 생성할 수 없습니다."));
        return;
      }
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0);
      
      // 타임스탬프 텍스트 포맷팅
      const formattedDate = formatDateTime(targetTimestamp);
      
      // 스탬프 스타일 설정
      const fontSize = Math.max(12, Math.min(img.width, img.height) * 0.02);
      const padding = fontSize * 0.5;
      const textX = padding;
      const textY = img.height - padding;
      
      // 배경 박스 그리기 (반투명)
      const textMetrics = ctx.measureText(formattedDate);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        textX - padding * 0.5,
        textY - textHeight - padding * 0.5,
        textWidth + padding,
        textHeight + padding
      );
      
      // 텍스트 그리기
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      ctx.textBaseline = "bottom";
      ctx.fillText(formattedDate, textX, textY);
      
      // Blob으로 변환
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(imageUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("이미지 변환에 실패했습니다."));
          }
        },
        file.type || "image/jpeg",
        0.95
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("이미지 로드에 실패했습니다."));
    };
    
    img.src = imageUrl;
  });
}

/**
 * Blob 이미지에 타임스탬프 스탬프를 추가
 * @param blob 원본 이미지 Blob
 * @param timestamp 타임스탬프 (기본값: 현재 시간)
 * @param options.brandingUrl 우측 하단에 표시할 브랜딩 URL 텍스트 (예: "readingtree.app")
 * @returns 스탬프가 추가된 Blob
 */
export async function addStampToBlob(
  blob: Blob,
  timestamp?: Date,
  options?: { brandingUrl?: string }
): Promise<Blob> {
  const targetTimestamp = timestamp || new Date();

  // 이미지 로드
  const img = new Image();
  const imageUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Canvas 생성
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Canvas context를 생성할 수 없습니다."));
        return;
      }

      // 이미지 그리기
      ctx.drawImage(img, 0, 0);

      // 타임스탬프 텍스트 포맷팅
      const formattedDate = formatDateTime(targetTimestamp);

      // 스탬프 스타일 설정
      const fontSize = Math.max(12, Math.min(img.width, img.height) * 0.02);
      const padding = fontSize * 0.5;
      const font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      ctx.font = font;
      const textX = padding;
      const textY = img.height - padding;

      // 배경 박스 그리기 (반투명)
      const textMetrics = ctx.measureText(formattedDate);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        textX - padding * 0.5,
        textY - textHeight - padding * 0.5,
        textWidth + padding,
        textHeight + padding
      );

      // 텍스트 그리기
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textBaseline = "bottom";
      ctx.fillText(formattedDate, textX, textY);

      // 브랜딩 URL (우측 하단)
      if (options?.brandingUrl) {
        const brandingFontSize = fontSize * 0.85;
        ctx.font = `bold ${brandingFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
        const brandingMetrics = ctx.measureText(options.brandingUrl);
        const brandingX = img.width - brandingMetrics.width - padding;
        const brandingY = img.height - padding;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(
          brandingX - padding * 0.5,
          brandingY - brandingFontSize - padding * 0.5,
          brandingMetrics.width + padding,
          brandingFontSize + padding
        );

        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.textBaseline = "bottom";
        ctx.fillText(options.brandingUrl, brandingX, brandingY);
      }

      // Blob으로 변환
      canvas.toBlob(
        (resultBlob) => {
          URL.revokeObjectURL(imageUrl);
          if (resultBlob) {
            resolve(resultBlob);
          } else {
            reject(new Error("이미지 변환에 실패했습니다."));
          }
        },
        blob.type || "image/png",
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("이미지 로드에 실패했습니다."));
    };

    img.src = imageUrl;
  });
}

/**
 * 날짜와 시간을 YYYY.MM.DD HH:mm 형식으로 변환
 */
function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${d} ${hh}:${mm}`;
}

