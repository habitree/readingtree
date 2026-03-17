import { BaseShortProps } from "./common";

export interface ScreenshotSlide {
  title: string;
  description: string;
  pcImage: string;
  mobileImage: string;
}

export interface ServiceShowcaseProps extends BaseShortProps {
  seriesId: string;
  tagline: string;
  slides: ScreenshotSlide[];
  ctaText: string;
}
