import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { BulkBookRegister } from "@/components/books/bulk-book-register";

export const metadata: Metadata = {
  title: "일괄 책 등록 | ReadTree",
  description: "여러 책을 한번에 검색하고 서재에 추가하세요",
};

export default function BulkBookPage() {
  return (
    <div className="space-y-6">
      <PageHeader titleKey="books.bulkTitle" descriptionKey="books.bulkDescription" />
      <BulkBookRegister />
    </div>
  );
}
