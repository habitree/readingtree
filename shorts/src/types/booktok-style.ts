import { BaseShortProps } from "./common";

export interface BooktokStyleProps extends BaseShortProps {
  /** 후킹 한 줄 (감정 리액션) */
  hookText: string;
  /** 책 인용구 또는 핵심 장면 */
  quoteText: string;
  /** 한 줄 리뷰 */
  reviewText: string;
  /** 별점 (1~5) */
  rating: number;
  /** 감정 태그 */
  emotionTags: string[];
  /** 책 제목 */
  bookTitle: string;
  /** 저자 */
  author: string;
  /** 커버 이미지 URL */
  coverImageUrl: string | null;
}
