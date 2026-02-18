import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색",
  description: "저장한 모든 독서 기록을 검색하세요 - 책, 기록, 태그별 필터링",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
