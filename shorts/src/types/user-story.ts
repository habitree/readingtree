import { BaseShortProps } from "./common";

export interface UserStoryProps extends BaseShortProps {
  /** 사용자 이름 */
  userName: string;
  /** Before 상태 설명 (문제 상황) */
  beforeText: string;
  /** After 상태 설명 (해결 후) */
  afterText: string;
  /** 전환 계기 (Habitree를 만나고...) */
  transitionText: string;
  /** 사용 기간 */
  duration: string;
  /** Before 통계 (예: "0권") */
  beforeStat: string;
  /** After 통계 (예: "23권") */
  afterStat: string;
  /** CTA 문구 */
  ctaText: string;
}
