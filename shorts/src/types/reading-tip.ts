import { BaseShortProps } from "./common";

export interface ReadingTipProps extends BaseShortProps {
  tipTitle: string;
  tipSteps: TipStep[];
  category: string;
}

export interface TipStep {
  title: string;
  description: string;
  icon: string;
}

export interface ReadingTipInputData {
  tipTitle: string;
  tipSteps: TipStep[];
  category: string;
  script: string;
}
