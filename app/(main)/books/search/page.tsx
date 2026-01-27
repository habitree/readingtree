import { BookSearch } from "@/components/books/book-search";
import { Metadata } from "next";
import { typography } from "@/lib/design-tokens";

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
      <div>
        <h1 className={typography.pageTitle}>책 검색</h1>
        <p className={typography.pageDescription}>
          책 제목이나 저자로 검색하여 내 서재에 추가하세요
        </p>
      </div>

      <BookSearch />
    </div>
  );
}

