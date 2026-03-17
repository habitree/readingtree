import { BaseShortProps } from "./common";

export interface CommunityHighlightProps extends BaseShortProps {
  /** 모임 이름 */
  groupName: string;
  /** 모임 주제 */
  topic: string;
  /** 멤버 수 */
  memberCount: number;
  /** 이번 달 읽는 책 */
  currentBook: string;
  /** 인기 메모/토론 하이라이트 */
  highlights: string[];
  /** CTA 문구 */
  ctaText: string;
}
