import { BaseShortProps, BookData } from "./common";

export interface BookReviewProps extends BaseShortProps {
  book: BookData;
  completedCount: number;
  keyQuotes: string[];
  summaryPoints: string[];
  rating: number;
  script: string;
}

export interface BookReviewInputData {
  book: BookData;
  completedCount: number;
  keyQuotes: string[];
  script: string;
}
