import Link from "next/link";
import { redirect } from "next/navigation";

import { getCachedCurrentUser } from "@/lib/cached";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SettingsPrivacyPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">프라이버시</CardTitle>
          <CardDescription>
            프로필과 기록 공개 범위, 법적 문서를 관리해요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/profile">프로필 공개 설정</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <Link href="/privacy">개인정보 처리방침 읽기</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full justify-start text-muted-foreground">
            <Link href="/terms">이용약관 읽기</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
