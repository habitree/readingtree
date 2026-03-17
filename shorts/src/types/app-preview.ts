import { BaseShortProps } from "./common";

export interface AppPreviewProps extends BaseShortProps {
  featureTitle: string;
  features: AppFeature[];
  stats: AppStat[];
}

export interface AppFeature {
  title: string;
  description: string;
  screenshotUrl?: string;
}

export interface AppStat {
  label: string;
  value: number;
  suffix: string;
}

export interface AppPreviewInputData {
  featureTitle: string;
  features: AppFeature[];
  stats: AppStat[];
  script: string;
}
