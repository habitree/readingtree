import { BookSearch } from "@/components/books/book-search";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "책 검색 | ReadTree",
  description: "네이버 검색 API를 통해 책을 검색하고 추가하세요",
};

/**
 * 책 검색 페이지
 * US-006: 책 검색 (네이버 API)
 */
export default function BookSearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="books.searchBook" descriptionKey="books.searchPageDesc" />

      <BookSearch />
    </div>
  );
}

