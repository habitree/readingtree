import {
  getBookRelationsStats,
  getBookRelationsGraph,
  getBookRelationsList,
  getTopConnectedBooks,
  getUsersWithRelations,
} from "@/app/actions/admin";
import { BookRelationsDashboard } from "@/components/admin/book-relations-dashboard";
import { Metadata } from "next";
import { isAdmin } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "책 연결 관계 | 관리자 | ReadingTree",
  description: "사용자의 책 연결 관계를 시각화하고 관리합니다",
};

export default async function BookRelationsPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const [stats, graph, relations, topBooks, users] = await Promise.all([
    getBookRelationsStats(),
    getBookRelationsGraph(),
    getBookRelationsList(1, 20),
    getTopConnectedBooks(10),
    getUsersWithRelations(),
  ]);

  return (
    <BookRelationsDashboard
      initialStats={stats}
      initialGraph={graph}
      initialRelations={relations}
      initialTopBooks={topBooks}
      users={users}
    />
  );
}
