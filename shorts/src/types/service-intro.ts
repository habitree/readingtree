import { BaseShortProps } from "./common";

export interface ServiceIntroProps extends BaseShortProps {
  tagline: string;
  painPoints: string[];
  features: ServiceFeature[];
  stats: ServiceStat[];
  ctaText: string;
}

export interface ServiceFeature {
  title: string;
  description: string;
  icon: "scan" | "sort" | "search" | "share";
}

export interface ServiceStat {
  label: string;
  value: string;
}
