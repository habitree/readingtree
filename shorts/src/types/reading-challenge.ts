import { BaseShortProps } from "./common";

export interface ReadingChallengeProps extends BaseShortProps {
  /** 챌린지 제목 */
  challengeTitle: string;
  /** 읽은 권수 */
  booksRead: number;
  /** 목표 권수 */
  booksGoal: number;
  /** 총 페이지 수 */
  totalPages: number;
  /** 장르별 분포 */
  genres: Array<{ name: string; count: number }>;
  /** 한국인 평균 대비 퍼센트 */
  percentile: number;
  /** CTA 문구 */
  ctaText: string;
}
