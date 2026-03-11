import { isAdmin } from "@/app/actions/auth";
import { getAllMembers } from "@/app/actions/admin";
import { MembersList } from "@/components/admin/members-list";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "회원 관리 | 관리자 | ReadingTree",
  description: "전체 회원 목록 및 활동 현황",
};

export default async function MembersPage() {
  const admin = await isAdmin();
  if (!admin) {
    redirect("/");
  }

  const members = await getAllMembers();

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          관리자 대시보드로 돌아가기
        </Link>
      </div>
      <MembersList members={members} />
    </div>
  );
}
