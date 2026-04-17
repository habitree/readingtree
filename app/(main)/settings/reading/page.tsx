import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { getCachedCurrentUser } from "@/lib/cached";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/app/actions/profile";

export default async function SettingsReadingPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile().catch(() => null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">독서 목표</CardTitle>
        <CardDescription>
          월별/연간 독서 목표를 관리해요. 상세 편집은 프로필에서 할 수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">월 목표</p>
          <p className="mt-0.5 text-2xl font-bold">
            {profile?.reading_goal ?? 12}권
          </p>
        </div>
        <Button asChild variant="outline" className="w-full justify-between">
          <Link href="/profile">
            프로필에서 편집하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
