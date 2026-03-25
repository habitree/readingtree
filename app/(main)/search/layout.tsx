import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 → 내 기록",
  description: "내 기록 페이지로 이동합니다",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
