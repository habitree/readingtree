import { BaseShortProps } from "./common";

export interface FeatureDemoProps extends BaseShortProps {
  seriesId: string;
  featureTitle: string;
  featureSubtitle: string;
  featureDescription: string;
  screenshotPC: string;
  screenshotMobile: string;
  highlights: string[];
  ctaText: string;
}
