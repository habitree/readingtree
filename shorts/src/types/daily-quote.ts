import { BaseShortProps, BookData } from "./common";

export interface DailyQuoteProps extends BaseShortProps {
  quoteText: string;
  bookTitle: string;
  author: string;
  pageNumber: number | null;
  coverImageUrl: string | null;
}

export interface DailyQuoteInputData {
  quote: {
    id: string;
    content: string;
    pageNumber: string | null;
  };
  book: BookData;
  script: string;
}
