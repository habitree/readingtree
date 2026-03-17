import { BaseShortProps } from "./common";

export interface CreatorCollabProps extends BaseShortProps {
  /** 크리에이터 이름 */
  creatorName: string;
  /** 크리에이터 소개 */
  creatorBio: string;
  /** 추천 책 제목 */
  bookTitle: string;
  /** 추천 책 저자 */
  bookAuthor: string;
  /** 추천 이유 (인용) */
  recommendQuote: string;
  /** 서재 속 책 수 */
  libraryCount: number;
  /** CTA 문구 */
  ctaText: string;
}
