import { BaseShortProps, BookData } from "./common";

export interface BookVsBookProps extends BaseShortProps {
  bookA: BookData & { highlights: string[] };
  bookB: BookData & { highlights: string[] };
  comparisonPoints: ComparisonPoint[];
  verdict: string;
}

export interface ComparisonPoint {
  label: string;
  bookAValue: string;
  bookBValue: string;
}

export interface BookVsBookInputData {
  bookA: BookData;
  bookB: BookData;
  comparisonPoints: ComparisonPoint[];
  script: string;
}
