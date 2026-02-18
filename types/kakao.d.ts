/**
 * Kakao JavaScript SDK 글로벌 타입 선언
 */

export interface KakaoShareFeedContent {
  title: string;
  description?: string;
  imageUrl?: string;
  link: {
    mobileWebUrl?: string;
    webUrl?: string;
  };
}

export interface KakaoShareButton {
  title: string;
  link: {
    mobileWebUrl?: string;
    webUrl?: string;
  };
}

export interface KakaoShareFeedOptions {
  objectType: "feed";
  content: KakaoShareFeedContent;
  buttons?: KakaoShareButton[];
}

export interface KakaoShare {
  sendDefault(options: KakaoShareFeedOptions): void;
}

export interface KakaoStatic {
  init(appKey: string): void;
  isInitialized(): boolean;
  Share: KakaoShare;
}

declare global {
  interface Window {
    Kakao?: KakaoStatic;
  }
}
