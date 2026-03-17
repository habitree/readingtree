import { BaseShortProps } from "./common";

export interface PainPointProps extends BaseShortProps {
  /** 공감 질문 (후킹) */
  hookQuestion: string;
  /** 문제 상황 리스트 */
  painPoints: string[];
  /** 해결책 한 줄 */
  solutionText: string;
  /** CTA 문구 */
  ctaText: string;
}
