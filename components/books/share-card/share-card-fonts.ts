"use client";

/**
 * 공유 카드 템플릿용 Google Fonts 온디맨드 로더
 *
 * 카드 템플릿에서만 쓰는 서체를 앱 전역 번들에 넣지 않고,
 * 다이얼로그가 열릴 때 필요한 family만 <link>로 주입한다.
 * (캡처 전 폰트 로드 완료는 capture-card 유틸의 document.fonts.ready가 보장)
 */

const FONT_QUERY: Record<string, string> = {
  "Noto Serif KR": "family=Noto+Serif+KR:wght@300;400;500;600;700;900",
  "Noto Sans KR": "family=Noto+Sans+KR:wght@300;400;500;700;900",
  "IBM Plex Sans KR": "family=IBM+Plex+Sans+KR:wght@300;400;500;600;700",
  "Gowun Batang": "family=Gowun+Batang:wght@400;700",
  "Nanum Pen Script": "family=Nanum+Pen+Script",
  "Do Hyeon": "family=Do+Hyeon",
  "Bebas Neue": "family=Bebas+Neue",
  "Playfair Display":
    "family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700",
  "Cormorant Garamond":
    "family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700",
  "Courier Prime": "family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700",
};

/** 지정한 family의 스타일시트 <link>를 중복 없이 주입 */
export function ensureShareCardFonts(families: string[]): void {
  if (typeof document === "undefined") return;
  for (const family of families) {
    const query = FONT_QUERY[family];
    if (!query) continue;
    const id = `share-card-font-${family.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(id)) continue;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
    document.head.appendChild(link);
  }
}
